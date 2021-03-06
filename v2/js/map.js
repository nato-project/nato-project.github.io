/*
 * StackedAreaChart - Object constructor function
 * @param _parentElement 	-- the HTML element in which to draw the visualization
 * @param _iedData			-- the ied data
 * @param _mapData			-- the map data
 * @param _regionData			-- the map regions data
 */
Map = function(_parentElement, _iedData, _mapData, _regionData){
    this.parentElement = _parentElement;
    this.iedData = _iedData;
    this.mapData = _mapData;
    this.regionData = _regionData;
    this.displayData = []; // see data wrangling
    this.filter = [];
    this.selectedRegion = "";

    // For region color
    this.dataType = "population";
    this.dataLabel = "Population";
    // For circle color
    this.circleType = "type";
    this.circleLabel = "Type";

    this.initVis();
}

/*
 * Initialize area chart with brushing component
 */

Map.prototype.initVis = function(){
    var vis = this; // read about the this

    vis.margin = {top: 0, right: 0, bottom: 0, left: 0};

    vis.width = 700 - vis.margin.left - vis.margin.right,
        vis.height = 600 - vis.margin.top - vis.margin.bottom;

    // SVG drawing area
    vis.svg = d3.select("#" + vis.parentElement).append("svg")
        .attr("x",0)
        .attr("y",0)
        .attr("viewBox","0 0 "+(vis.width + vis.margin.left + vis.margin.right)+" "+(vis.height + vis.margin.top + vis.margin.bottom))
        .append("g")
        .attr("transform", "translate(" + vis.margin.left + "," + vis.margin.top + ")");

    vis.svg.append("rect")
        .attr("height", vis.height)
        .attr("width", vis.width)
        .attr("opacity", 0)
    	.on("click", function(){
    		regionClick("");
    	});
        
    // Create projection
    var projection = d3.geo.mercator().scale([2150]).center([34.5, 48.5]);
    vis.proj = projection;

    // Create D3 geo path
    var path = d3.geo.path().projection(projection);

    // Convert TopoJSON to GeoJSON
    var countries = topojson.feature(mapData, mapData.objects.countries).features;
    var regions = topojson.feature(mapData, mapData.objects.regions).features;

    // Tool Tip
    vis.tip = d3.tip().attr('class', 'd3-tip').html(function(d) {
        // Color
        var data;
        vis.regionData.forEach(function(r) {
            if (r.region_id == d.id) data = r;
        });
        var tipContent = "";
        tipContent += "<div class='tooltip-content text-center'>" + d.properties.name + " Oblast</div>";
        tipContent += "<div class='tooltip-content text-center'>IED Events: " + data.IEDevents + " / Killed: " + data.KIA + " / Wounded: "+data.WIA+"</div>";
        tipContent += "<div class='tooltip-content text-center'>Area: " + data.area + "km2 / Population: "+ data.population + "</div>";

        return tipContent;
    });
    vis.ctrtip = d3.tip().attr('class', 'd3-tip').html(function(d) {
        var tipContent = "<div class='tooltip-content text-center'>" + d.properties.name + "</div>";
        return tipContent;
    });

    // Map TopoJSON data to the screen
    // Countries
    ctrG = vis.svg.append("g");
    ctrG.selectAll("path")
        .data(countries)
        .enter().append("path")
        .attr("id", function(d) { return d.id;})
        .attr("class", "country")
        .attr("d", path)
        .style("stroke", "grey")
        .style("stroke-width", 1)
        .style("fill", "#efefef")
        .on('mouseover', vis.ctrtip.show)
        .on('mouseout', vis.ctrtip.hide)
        .call(vis.ctrtip)
        .on("click", function(d){
            regionClick("");
        });

    // Regions
    regionsG = vis.svg.append("g");
    regionsG.selectAll("path")
        .data(regions)
        .enter().append("path")
        .attr("class", "region")
        .attr("id", function(d) { return d.id;})
        .attr("d", path)
        .style("stroke", "grey")
        .style("stroke-width", 1)
        .style("fill", "lightgrey")
        .on('mouseover', vis.tip.show)
        .on('mouseout', vis.tip.hide)
        .call(vis.tip)
   	    .on("click", function(d){
   	    	regionClick(d.id);
   	    });

    regionsG.selectAll("text")
	    .data(regions)
	    .enter().append("text")
	    .text(function (d) {return d.id;})
	    .attr("transform", function(d) {
	    	var trans = vis.proj([d.properties.label_point[0], d.properties.label_point[1]]);
	    	return "translate("+trans[0]+"," +trans[1]+ ")";
	    })
	    .attr("id", function(d) { return d.id;})
	    .on("mouseover", vis.tip.show)
	    .on("mouseout", vis.tip.hide)
	    .call(vis.tip);

    // Set region type and color scales
    vis.colors = d3.scale.quantize().domain([0,1]).range(colorbrewer.Blues[7]);
    vis.typeScale = d3.scale.linear().range([0,1]);

    // Region legend data
    var legendColors = vis.colors.range();
    var legendValues = [0];
    vis.colors.range().forEach(function(d,i) {
        legendValues.push(Math.round(vis.typeScale.invert(vis.colors.invertExtent(d)[1])));
    });
    legendValues.push("No data");
    legendColors.push("lightgrey");
    vis.side = 20;

    // Create legend
    var legend = vis.svg.append("g")
        .attr("transform", "translate(100, 315)")
        .attr("id", "legend");

    // Legend title
    legend.append("text")
        .attr("text-anchor","end")
        .attr("transform", "translate(10, -8)")
        .attr("id","legendTitle");

    // Add color squares
    legend.append("g").selectAll("rect")
        .data(legendColors)
        .enter()
        .append("rect")
        .attr("class", "legendColor")
        .attr("fill", function (d) {return d;})
        .style("stroke", "grey")
        .attr("height", vis.side)
        .attr("width", vis.side)
        .attr("transform", function(d, i) {
            return "translate(2," + (i*(vis.side+3)+5) +")";
        });

    // Add values
    legend.append("g").selectAll("text")
        .data(legendValues)
        .enter()
        .append("text")
        .attr("class", "legendValue")
        .attr("text-anchor","end")
        .attr("transform", function(d, i) {
            if (i==8) return "translate(0," + (i*(vis.side+3)-3) +")";
            return "translate(0," + (i*(vis.side+3) + 5) +")";
        });

    // Set circle color legend
    vis.circleColorType = d3.scale.ordinal();
    vis.circleColorType.domain(["CACHE/FOUND","CRIME","CWIED","HOAX/FALSE","PROJECTED","RCIED","S-PBIED","TIME DELAY","UNKNOWN","VBIED","VOIED"]);
    vis.circleColorType.range([COMMON_COLORS["CACHE/FOUND"],COMMON_COLORS["CRIME"],COMMON_COLORS["CWIED"],COMMON_COLORS["HOAX/FALSE"],COMMON_COLORS["PROJECTED"],COMMON_COLORS["RCIED"],COMMON_COLORS["S-PBIED"],COMMON_COLORS["TIME DELAY"],COMMON_COLORS["UNKNOWN"],COMMON_COLORS["VBIED"],COMMON_COLORS["VOIED"]]);
    vis.circleColorEffect = d3.scale.ordinal().domain(["Killed","Wounded","No Casualities"]).range([COMMON_COLORS.KILLED,COMMON_COLORS.WOUNDED,COMMON_COLORS.NO_CASUALITY]);
    vis.circleColor = vis.circleColorType;

    // Legend
    vis.clegend = vis.svg.append("g")
        .attr("transform", "translate(130,300)")
        .selectAll("g")
        .data(vis.circleColor.range())
        .enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + (i*(vis.side) + 15) + ")"; });
    // Legend title
    vis.clegend.append("text")
        .attr("id","colorLegendTitle")
        .attr("transform", "translate(5,-5)")
    // Legend circles
    vis.clegendbox = vis.clegend.append("circle")
        .attr("class", "circleColorCircles");
    vis.clegendlabels = vis.clegend.append("text")
        .attr("class", "circleColorLabels");


    // Create circles group
    vis.circlesG = vis.svg.append("g");

    // Add random translations to IED data to avoid perfect overlap
    vis.iedData.forEach(function(d) {
    	// Ramdomly spread it around the center point up to 4 pixels
    	d.tx = 8*(Math.random()-0.5);
    	d.ty = 8*(Math.random()-0.5);
    });
    
    // Wrangle and update
    vis.wrangleData();

}

Map.prototype.wrangleData = function() {
    var vis = this; // read about the this

    // Filter with timeline
    vis.displayData = vis.iedData;
    if (vis.filter.length > 0) {
        vis.displayData = vis.iedData.filter(function (d) {
            var first = new Date(d.date) >= vis.filter[0];
            var second = new Date(d.date) <= vis.filter[1];
            return first && second;
        });
    }

    // Update the visualization
    vis.updateVis();

}

Map.prototype.updateVis = function() {
    var vis = this; // read about the this

    // Update scale
    var maxValue = d3.max(regionData, function(d) {return d[vis.dataType];});
    vis.typeScale.domain([0, maxValue]);

    // Region colors
    vis.svg.selectAll(".region")
        .style("fill",function(d) {
        	if (d.id == vis.selectedRegion) return "orange";
            // Color
            var data;
            regionData.forEach(function(r) {
                if (r.region_id == d.id) data = r;
            });
            if (data) {
                var value = data[vis.dataType];
                if (isNaN(value)) return "lightgrey";
                return vis.colors(vis.typeScale(value));
            }
            else return "lightgrey";
        });

    // Update legend
    d3.select("#legendTitle").text(vis.dataLabel);
    var legendValues = [0];
    vis.colors.range().forEach(function(d,i) {
        legendValues.push(Math.round(vis.typeScale.invert(vis.colors.invertExtent(d)[1])));
    });
    legendValues[legendValues.length-1] = "No data";
    var entries = vis.svg.selectAll(".legendValue")
        .data(legendValues)
        .text(function (d) {return d;});

    // Update circle color
    if (vis.circleType == "type") {
        vis.circleColor = vis.circleColorType;
    } else {
        vis.circleColor = vis.circleColorEffect;
    }
    
    // Add event circles
    var circ = vis.circlesG.selectAll("circle")
        .data(vis.displayData);

    // Enter
    circ.enter().append("circle")
        .attr("class", "iedEventCircle");

    // Update
    circ.attr("id", function(d) { return d.id;})
        .attr("cx", function(d) {
        	return d.tx + vis.proj([d.lng, d.lat])[0];})
        .attr("cy", function(d) {
        	return d.ty + vis.proj([d.lng, d.lat])[1];})
        .attr("r", 4)
        .attr("fill", function(d) {
            if(vis.circleType == "type") {
                return vis.circleColor(d.type);
            }else{
                if(d.kia > 0){
                    return vis.circleColor("Killed");
                }else if(d.wia > 0){
                    return vis.circleColor("Wounded");
                }else{
                    return vis.circleColor("No Casualities");
                }
            }
        })
        .attr("stroke", "black")
        .attr("stroke-width", 1)
        .attr("opacity", 1);

    // Exit
    circ.exit().remove();

    // Circle legend
    d3.select("#colorLegendTitle").text(vis.circleLabel);
    vis.clegend = vis.clegend.data(vis.circleColor.range());
    vis.clegend.exit().remove();
    vis.clegend.enter()
        .append("g")
        .attr("transform", function(d, i) { return "translate(0," + (i*(vis.side) + 20) + ")"; });
    vis.clegendbox.remove();
    vis.clegendbox = vis.clegend.append("circle")
        .attr("r", 5)
        .attr("cx", vis.side/2)
        .attr("cy", vis.side/2)
        .style("fill", function(d){return d;})
        .attr("stroke", "black")
        .attr("stroke-width", 1);
    vis.clegendlabels.remove();
    vis.clegendlabels = vis.clegend.append("text")
        .attr("class", "circleLegendLabels")
        .attr("x", 19)
        .attr("y", 15)
        .text(function(d,i){
            return vis.circleColor.domain()[i];
        });
}