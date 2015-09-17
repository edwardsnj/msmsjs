// d3 Mass Spectrum Viewer
//
// Copyright (c) 2015 Chris Trenkov
//
// This code was written by Chris Trenkov
// Not intended for public use
// Last updated 8/31/2015


function spcls(container,tag) {
        return (container+'-'+tag);
}

function tipcls(container,tag) {
	return "d3-tip-"+spcls(container,tag);
}

function appendSpectrum(container, tag, width, height){
	d3.select("."+container)
		.append("svg")
		.attr("class", spcls(container,tag))
		.attr("width", width)
		.attr("height", height);
}

function showSpectrum(container, tag, path, tolerance){

	clearSpectrum(container, tag);

	var margin = {top: 10, bottom: 20, left: 80, right: 40};

	var canvas =  d3.selectAll("svg."+spcls(container,tag));

	var canvasWidth = canvas.attr("width");
	var canvasHeight = canvas.attr("height");
	
	var containerWidth = canvasWidth - (margin.left + margin.right);
	var containerHeight = canvasHeight - (margin.top + margin.bottom);

	var peptideSpace = 40; 			 <!-- dev options
	var peptidePadding = 40;
	var peptidePixelSize = 40;
	
	var transitionDuration = 500;
	var transitionDelay = 300;
	var transitionType = "bounce";

	var baseHeightPercent = .05;
	var colorTheme = {b: "steelBlue", y: "tomato", other: "grey"};	

	var group = canvas.append("g")
		.attr("class", "group");	<!-- TODO, Change all of the attr class tags to something better
	
	var backgroudGroup = group.append("g")
		.attr("class", "backgroudGroup");
	
	var selectGroup = group.append("g")
		.attr("class", "select")
		.attr("transform", "translate(" + [margin.left, margin.top] + ")");

	var chartGroup = group.append("g")
		.attr("class", "chartGroup")
		.attr("transform", "translate(" + [margin.left, margin.top] + ")");
	
	var containerGroup = chartGroup.append("g")
		.attr("class", "container");
	
	var peptideGroup = containerGroup.append("g")
		.attr("class", "peptide");
	
	var elementGroup = containerGroup.append("g")
		.attr("class", "elements");
	
	var peakGroup = elementGroup.append("g")
		.attr("class", "peaks");
	
	var fragmentGroup = elementGroup.append("g")
		.attr("class", "fragments");
	
	var fragmentLabelGroup = fragmentGroup.append("g")
		.attr("class", "labelGroup");
	
	var fragmentSelectedGroup = fragmentGroup.append("g")
		.attr("class", "fragementSelectedGroup");
	
	var xAxisGroup = chartGroup.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(" + [0, containerHeight] + ")");
		
	var yAxisGroup = chartGroup.append("g")
		.attr("class", "y axis");
	
	var resizeGroup = selectGroup.append("g")
		.attr("class", "resize");
	
	d3.json(path, function (data){
	
		var spectra = data.spectra;
		var peaks = spectra[0].peaks;
		var peptide = spectra[0].annotations[0].peptide;
		var fragments = spectra[0].annotations[0].fragments;
		var newFragments = [];
		var usedPeak = {}
		
		var maxPeaksInt = d3.max(peaks, function (d){ return d.int; });
		var minPeaksInt = d3.min(peaks, function (d){ return d.int; });
		
		var maxPeaksMZ = d3.max(peaks, function (d){ return d.mz; });
		var minPeaksMZ = d3.max(peaks, function (d){ return d.mz; });
		
		fragments.forEach(appendFragments);		<!-- gets all of the fragment that meet the threshhold and 
		newFragments.forEach(drawSymbole);
		
		var domain = {min: 0, max: containerWidth};
		var newDomain = {min: 0, max: containerWidth};
		var scale = 1;
		
		var widthScale = d3.scale.linear()
			.domain([0, maxPeaksMZ])
			.range([0, containerWidth]);
			
		var heightScale = d3.scale.linear()
			.domain([0, maxPeaksInt + 100*maxPeaksInt/containerHeight])
			.range([0, containerHeight]);
		
		var xAxisScale = d3.scale.linear()
			.domain([0, maxPeaksMZ])
			.range([0, containerWidth]);
			
		var yAxisScale = d3.scale.linear()
			.domain([maxPeaksInt + 100*maxPeaksInt/containerHeight, 0])
			.range([0, containerHeight]);
		
		var clickScale = d3.scale.linear()
			.domain([0, containerWidth]) 	
			.range([0, maxPeaksMZ]);
		
		var colorScale = d3.scale.linear()
			.domain([0, containerWidth])
			.range(["skyBlue", "steelblue"]);

		

		var drag = d3.behavior.drag()
			.on("dragstart", dragStarted)
			.on("drag", dragged)
			.on("dragend", dragEnded);

		var xAxis = d3.svg.axis()
			.scale(xAxisScale)
			.orient("bottom")
			.ticks(12)
			.tickSize(3);
		
		var yAxis = d3.svg.axis()
			.scale(yAxisScale)
			.orient("left")
			.ticks(12)
			.tickSize(3);
		
		var tip = d3.tip()
			.attr('class', 'd3-tip '+tipcls(container,tag))
			.offset([-40, 0])
			.html(function(d) {
				return "<span style='color: #3f3f3f' > " + toolTip(d) + " </span>";
			});
			
		var background = backgroudGroup.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("rx", 10)
			.attr("ry", 10)
			.attr("width", canvasWidth)
			.attr("height", canvasHeight);	
		
		var dePeakRenderOmatic = yAxisGroup.append("rect") <!-- Renders a white rect under the yaxis to cover the peaks, it is really dumb, I know
			.attr("x", -margin.left)
			.attr("width", margin.left)
			.attr("height", containerHeight)
			.attr("fill",canvas.style("background-color"));

		var selectArea = selectGroup.append("rect")
			.attr("x", 0)
			.attr("y", 0)
			.attr("width", canvasWidth)
			.attr("height", canvasHeight)
			.attr("fill", "none")
			.style("pointer-events", "all")
			.on("contextmenu", function (d, i) {
				d3.event.preventDefault();
			});
		
		
		
		var peptide = peptideGroup.selectAll("text") 
			.data(peptide)
			.enter()
				.append("text")
				.attr("x", function (d, i){ return i * peptideSpace + peptidePadding; })
				.attr("y", peptidePadding)
				.attr("font-size", peptidePixelSize)
				.text(function (d){ return d + ""}); <!-- TODO ADD subscripts
		
		var peakElements = peakGroup.selectAll("rect")
			.data(peaks)
			.enter() 
				.append("g")
				.attr("class", function (d, i){ return "peak " + i; })
				.append("rect")
				.attr("x", function (d){ return widthScale(d.mz); })
				.attr("y", containerHeight)
				.attr("width", 2)
				.attr("height", 0)
				.attr("fill", "white")
				.attr("opacity", "1")
				.on("mouseover", function (d){ 
					tip.offset([-10, 0]);
					showToolTip();
					tip.show(d);
					hideToolTip();
				});
		
		var fragmentElements = fragmentGroup.selectAll("rect")
			.data(newFragments)
			.enter()
				.append("g")
				.attr("class", function (d, i){ return "fragment " + i; })
				.append("rect")
				.attr("x", function (d){ return widthScale(d.mz); })
				.attr("y", containerHeight)
				.attr("width", 2)
				.attr("height", 0)
				.attr("fill", function (d){ return d.color; })
				.on("mouseover", function (d){ 
					tip.offset([-23, 0]);
					showToolTip();
					tip.show(d); 
					hideToolTip(); 
				});

		var fragmentLabels = fragmentLabelGroup.selectAll("text")
			.data(newFragments)
			.enter()
				.append("g")
				.attr("class", "label")
				.attr("transform", function (d){ 
					return "translate(" + [widthScale(d.mz), containerHeight - heightScale(d.int)] + ")";
				})
				.append("text")
				.attr("x", -17 / 4)
				.attr("y", function (d){ return heightScale(d.int); })
				.text(function (d){ return getLabel(d);})
				.style("font-size", "17px")
				.style("opacity", "0");



		peakElements.transition()
			.duration(transitionDuration)
			.delay(transitionDelay)
			.ease(transitionType)
			.attr("y", function (d){ return (containerHeight - heightScale(d.int)); })
			.attr("height", function (d){ return heightScale(d.int); })
			.attr("fill", colorTheme.other)
			.attr("opacity", ".5");

		fragmentElements.transition()
			.duration(transitionDuration)
			.delay(transitionDelay)
			.ease(transitionType)
			.attr("y", function (d){ return containerHeight - heightScale(d.int); })
			.attr("height", function (d){ return heightScale(d.int); })
			.attr("fill", function (d){ return d.color; });

		fragmentLabels.transition()
			.duration(transitionDuration)
			.delay(transitionDelay)
			.ease(transitionType)
			.attr("y", -5)
			.style("opacity", "1");
		


		containerGroup.call(tip);	
		selectGroup.call(drag);
		xAxisGroup.transition().duration(transitionDelay).call(xAxis);
		yAxisGroup.transition().duration(transitionDelay).call(yAxis);
		

				
		var originalX;
		var originalY;
		var lastMouseX;
		var lastMouseY;
		var resizeWidth;
		var resizeHeight;
		var selectWidth;
		var selectHeight;
		
		var isLeftClick;
		var isMiddleClick;
		var isRightClick;
		
		var zoomDuration = 1000;

		
		function resetDomain(){
			newDomain.min = xAxisScale.range()[0];
			newDomain.max = xAxisScale.range()[1];

			tooltipTransition(0, 500, 0);
		}
		
		function dragStarted(){
			originalX = d3.mouse(this)[0];
			originalY = d3.mouse(this)[1];
			
			
			
			isLeftClick = d3.event.sourceEvent.which == 1;
			isMiddleClick = d3.event.sourceEvent.which == 2;
			isRightClick = d3.event.sourceEvent.which == 3;
			
			if(isLeftClick) resizeStarted();
			else if(isMiddleClick || isRightClick) resetDomain();

		}
		
		function dragged(){
			lastMouseX = d3.mouse(this)[0];
			lastMouseY = d3.mouse(this)[1];
			
			if(isLeftClick) resized();
		}
		
		function dragEnded(){
			resizeEnded();
		}
		
		
		
		function resizeStarted(){
			resetDomain();
			
			resizeGroup.append("rect")
				.attr("x", originalX)
				.attr("y", originalY)
				.attr("rx", 5)
				.attr("ry", 5)
				.attr("width", 0)
				.attr("height", 0)
				.attr("stroke", "steelblue")
				.attr("stroke-width", 2)
				.attr("stroke-dasharray", [10, 5])
				.attr("fill", "none");
		}
		
		function resized(){
			resizeWidth = lastMouseX - originalX;
			resizeHeight = lastMouseY - originalY;
			
			resizeGroup.selectAll("rect")
				.attr("width", Math.abs(resizeWidth))
				.attr("height", Math.abs(resizeHeight));
			
			if(resizeWidth < 0){
				resizeGroup.selectAll("rect")
					.attr("x", lastMouseX);
				newDomain.min = (lastMouseX / scale) + domain.min;
				newDomain.max = (originalX / scale) + domain.min;
			}else{
				newDomain.min = (originalX / scale) + domain.min;
				newDomain.max = (lastMouseX / scale) + domain.min;
			}
				
			if(resizeHeight < 0){
				resizeGroup.selectAll("rect")
					.attr("y", lastMouseY);
			}
		}
		
		function resizeEnded(){
			xAxisScale.domain([clickScale(newDomain.min), clickScale(newDomain.max)]);
			xAxisGroup.transition().duration(zoomDuration).call(xAxis);
			
			scale = (maxPeaksMZ) / (clickScale(newDomain.max) - clickScale(newDomain.min));
							
			domain.min = newDomain.min;
			domain.max = newDomain.max;
			
			elementGroup.transition()
				.duration(zoomDuration)
				.attr("transform", "translate(" + [-domain.min * scale, 0] + ")scale(" + [scale, 1] + ")")
				.selectAll("rect")
				.attr("width", 2 / scale)
				.each("end", function(){ tooltipTransition(0, 500, 0); });
	
			fragmentLabelGroup.selectAll("text") .attr("transform", "scale(" + [1 / scale, 1] + ")");
				
			resizeGroup.selectAll("rect")
				.transition()
				.duration(zoomDuration)
				.attr("x", 0)
				.attr("y", 0)
				.attr("rx", 10)
				.attr("ry", 10)
				.attr("width", containerWidth)
				.attr("height", containerHeight)
				.remove();

			tooltipTransition(0, 500, 0);
		}	
		
		<!-- peptide symbol rendering
		
		
		
		function drawSymbole(fragment, i){	<!-- TODO REDO
			
			if(fragment.type == "b-ion"){
				var startX = peptideSpace * (fragment.subscript - 1) + peptidePadding;
				var startY = peptidePadding + 3;
				
				peptideGroup.append("rect")
					.attr("x", startX + 1)
					.attr("y", startY)
					.attr("width", peptidePixelSize / 2 + 2)
					.attr("height", 4)
					.attr("fill", fragment.color);
					
				peptideGroup.append("line")
					.attr("x1", startX + peptidePixelSize / 2)
					.attr("y1", startY + 3)
					.attr("x2", startX + (peptidePixelSize / 4) + (peptideSpace / 2))//
					.attr("y2", startY - (peptidePixelSize / 4) - 3)
					.attr("stroke", fragment.color)
					.attr("stroke-width", 5);
			}
			else if(fragment.type == "y-ion"){
			
				var startX = peptideSpace * (peptide.length - fragment.subscript) + peptidePadding;
				var startY = peptidePadding - (peptidePixelSize) + 9;
				
				peptideGroup.append("rect")
					.attr("x", startX - 1)
					.attr("y", startY + 1)
					.attr("width", peptidePixelSize / 2 + 2)
					.attr("height", 4)
					.attr("fill", fragment.color);
					
				peptideGroup.append("line")
					.attr("x1", startX)
					.attr("y1", startY + 3)
					.attr("x2", startX - (peptideSpace / 4))//
					.attr("y2", startY + (peptidePixelSize / 2) + 1)
					.attr("stroke", fragment.color)
					.attr("stroke-width", 5);
			}
		}
		

		
		function appendFragments(fragment, i){

			var hasFoundPeak = false;
			var bestPeak = {"int": 0, "mz": 0};
			
			for(var i = 0; i < peaks.length; i++){
				var peak = peaks[i];
				
				if(Math.abs(fragment.mz - peak.mz) <= tolerance){
					if(peak.int >= bestPeak.int){
						bestPeak = peak;
					}
					hasFoundPeak = true;
				}
			}
			
			if (hasFoundPeak && isAboveThreshHold(bestPeak.int) && !usedPeak[bestPeak.mz]){
					
				usedPeak[bestPeak.mz] = true;

				fragment.delta = (bestPeak.mz - fragment.mz)
				// for positioning...
				fragment.mz = bestPeak.mz;
				fragment.int = bestPeak.int;
				
				if(fragment.type == "b-ion"){
					fragment.color = colorTheme.b; 
				}
				else if(fragment.type == "y-ion"){
					fragment.color = colorTheme.y; 
				}

				newFragments.push(fragment);

			}
		}
		
		function isAboveThreshHold(height){
			return maxPeaksInt * baseHeightPercent <= height;
		}
		
		function showToolTip(){
			d3.selectAll("."+tipcls(container,tag)).transition()
				.delay(0)
				.duration(0)
				.style("opacity", 1)
				.style('pointer-events', 'all')
		}
		
		function hideToolTip(){
			d3.selectAll("."+tipcls(container,tag))				<!-- Allows for hover functionality, might remove later
				.on("mouseover", function (){ 
					d3.select("."+tipcls(container,tag))
						.transition()
						.delay(0);

				})
				.on("mouseout", function (){ 
					tooltipTransition(0, 500, 0);
				});

			tooltipTransition(1500, 500, 0);
		}
		
		function tooltipTransition(delay, duration, opacity){
			d3.selectAll("."+tipcls(container,tag))
				.transition()
				.delay(delay)
				.duration(duration)
				.style("opacity", opacity)
				.style('pointer-events', 'none');
		}

	});
 }
 
var superScript = "⁰¹²³⁴⁵⁶⁷⁸⁹";
var subscripts = "₀₁₂₃₄₅₆₇₈₉";
	
function getSuperscript(num){
	num += "";
	var newSuperScript = "";
		
	for(var i = 0; i < num.length; i++){
		newSuperScript += superScript[parseInt(num[i])];
	}
		
	return newSuperScript;
}

function getLabel(d) {
  if ((d.type == 'y-ion') || (d.type == 'b-ion')) {
    if (d.z == 1) {
      return (d.label + getSubscript(d.subscript));
    } else {
      return (d.label + getSubscript(d.subscript) + getSuperscript(d.z) + '\u207A');
      // return d.simplelabel;
    }
  } else {
    return d.simplelabel;
  }
}

function getSubscript(num){
	num += "";
	var newSubScripts = "";
		
	for(var i = 0; i < num.length; i++){
		newSubScripts += subscripts[parseInt(num[i])];
	}
	return newSubScripts;
}

function toolTip(d) {
	var tt = roundWidthZeros(d.mz);
	if (d.delta == undefined) {
	  // peak, not fragment
	  return tt;
        }
	if( d.delta >= 0) {
	  tt += (" (+" + roundWidthZeros(Math.abs(d.delta)) + ")");
        } else {
	  tt += (" (-" + roundWidthZeros(Math.abs(d.delta)) + ")");
        }
	return tt;
}
	
function roundWidthZeros(num){
	num = Math.round(num * 100) / 100;
	if (num == 0) {
	  return "0.00";
        }
	if((num + "").split(".")[1].length <= 1) num += "0"; // adds a zero if the length of the str after the . is less than 2
		
	return num;
}
 
function clearSpectrum(container,tag){
	d3.selectAll("."+spcls(container,tag)).selectAll(".group").remove();
	d3.selectAll("."+tipcls(container,tag)).remove();
}

function deleteSpectrum(container,tag){
	d3.selectAll("."+spcls(container,tag)).remove();
	d3.selectAll("."+tipcls(container,tag)).remove();
}

