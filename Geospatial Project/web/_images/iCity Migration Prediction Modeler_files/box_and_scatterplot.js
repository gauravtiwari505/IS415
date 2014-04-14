var dimensions;
var moranDimensions;
var currentDimIndex = 0;
var processedData;
var processedMoranData;
var globalMoranData;
var currentDimensionStats;
var moranDimensionStats;
var significanceThreshold = 0.05;
var nonSignificantColor = "#FFFFFF";
var lowestLightness = 0.1;
var highestLightness = 0.9;
var percent_scale = d3.scale.linear().range([lowestLightness,highestLightness]);
var legendGradientWidth = 25;
var legendGradientHeight = 160;

var boxplotHeight = 88;
var boxplotWidth = 458;
var boxplotTopMar = 5;
var boxplotBotMar = 8;
var boxplotLeftMar = 10;
var boxplotRightMar = 10;
var boxplotBrush;

var scatterplotHeight = 360;
var scatterplotWidth = 458;
var scatterplotTopMar = 15;
var scatterplotBotMar = 45;
var scatterplotLeftMar = 75;
var scatterplotRightMar = 10;
var scatterplotBrush;

var transitionDuration = 1000;
var postiveHue = 200;
var negativeHue = 30;
var positiveWeight;
var negativeWeight;

//https://github.com/mbostock/d3/wiki/Ordinal-Scales#wiki-ordinal_rangePoints
var variableBoxplotNameScale;
var xAxisBoxplotScale;
var variableScatterplotNameScale;
var xAxisScatterplotScale;
var yAxisScatterplotScale;
//var yAxisScatterplotScale;

//Margin, Width, Height
var marginBoxplotPlot;
var widthBoxplotPlot;
var heightBoxplotPlot;
    
var marginScatterplotPlot;
var widthScatterplotPlot;
var heightScatterplotPlot;

$(document).ready(function(){
    bootstrap();
})

function bootstrap(){
    
    $("input:radio[name=contiguityType]").change(function(){
        processMoran();
    });
        
    processedData = [];
    filename = "";    
    
    $.ajax({
        url: './MoranRCtrl',  
        data:{
            action:"MoransProcessing",
            contiguity:$("input:radio[name='contiguityType']:checked").val()

        },
        dataType: 'JSON',
        async: false,  
        success: function(data){
            //console.log(data);
            var data0 = data.csvData;
            globalMoranData = data.globalMoran;
            
            //Margin, Width, Height
            marginBoxplotPlot = [boxplotTopMar, boxplotRightMar, boxplotBotMar, boxplotLeftMar],
            widthBoxplotPlot = boxplotWidth - marginBoxplotPlot[1] - marginBoxplotPlot[3],
            heightBoxplotPlot = boxplotHeight - marginBoxplotPlot[0] - marginBoxplotPlot[2];
            
            marginScatterplotPlot = [scatterplotTopMar, scatterplotRightMar, scatterplotBotMar, scatterplotLeftMar],
            widthScatterplotPlot = scatterplotWidth - marginScatterplotPlot[1] - marginScatterplotPlot[3],
            heightScatterplotPlot = scatterplotHeight - marginScatterplotPlot[0] - marginScatterplotPlot[2];            
            
            //https://github.com/mbostock/d3/wiki/Ordinal-Scales#wiki-ordinal_rangePoints
            variableBoxplotNameScale = d3.scale.ordinal().rangePoints([0, widthBoxplotPlot],1),
            xAxisBoxplotScale = [],
            variableScatterplotNameScale = d3.scale.ordinal().rangePoints([0, widthScatterplotPlot],1),
            variableScatterplotYNameScale = d3.scale.ordinal().rangePoints([0, widthScatterplotPlot],1),
            xAxisScatterplotScale = [],
            yAxisScatterplotScale = [],
            dragging = {};
        
            processedData = data0;
        
            // Extract the list of dimensions and create a scale for each for the boxplot.
            variableBoxplotNameScale.domain(dimensions = d3.keys(processedData[0]).filter(function(d) {
                return d != "Province" && d!="" && d!="Variable" && d!="FIPS_CNTRY" && (xAxisBoxplotScale[d] = d3.scale.linear()
                    .domain(d3.extent(processedData, function(p) {
                        return +p[d];
                    }))
                    .range([0, widthBoxplotPlot]));
            }));
            
            // Extract the list of dimensions and create a scale for each for the scatterplot.
            variableScatterplotNameScale.domain(dimensions = d3.keys(processedData[0]).filter(function(d) {
                
                return d != "Province" && d!="Variable" && d!="FIPS_CNTRY"// && d.toString().indexOf("_Iisig")==-1
                && (xAxisScatterplotScale[d] = d3.scale.linear()
                    .domain(d3.extent(processedData, function(p) {
                        return +p[d];
                    }))
                    .range([0, widthScatterplotPlot]));
            }));
            
            variableScatterplotYNameScale.domain(moranDimensions = d3.keys(processedData[0]).filter(function(d) {
                return d != "Province" && d!="Variable" && d!="FIPS_CNTRY"// && d.toString().indexOf("_Iisig")==-1
                && d.toString().indexOf("_lagged")>-1 && (yAxisScatterplotScale[d] = d3.scale.linear()
                    .domain(d3.extent(processedData, function(p) {
                        //if(d.toString().indexOf("_Iisig")==-1){
                        return +p[d];
                    //}
                    }))
                    .range([heightScatterplotPlot, 0]));
            }));
        
            /*************** Calculating the BoxPlot Statistics for ********************/
        
            var tempStatObject = {};
            // Stores a temp "dump" of data to calcuate each statatics
            var tempVarDump = [];
        
            for (var plotVarKey in dimensions){
                var plotVariable = dimensions[plotVarKey];
            
                //******** ADDED THIS TO POPULATE DIMENSION DROPLIST *********
                
                if(plotVariable.indexOf("_Ii")==-1 && plotVariable.indexOf("_lagged")==-1){
                    var optionString = "<option value=\""+plotVariable+"\">"+plotVariable+"</option>";
                
                    $('#selectedDroplist').html($('#selectedDroplist').html()+optionString);         
                   
                }
                
                //************************************************************
            
                var sumTotal = 0;
            
                for (var i=0;i<processedData.length;i++){
                    tempVarDump.push(processedData[i][plotVariable]);
                
                    sumTotal += parseFloat(processedData[i][plotVariable]);
                }
            
                var avg = sumTotal / processedData.length;
            
                var variance = 0;
                for (var j=0;i<processedData.length;j++){
                    variance += Math.pow((parseFloat(processedData[j][plotVariable]) - avg), 2);
                }
            
                variance = variance / processedData.length;
            
                var standD = Math.sqrt(variance);
            
                // need to sort array before can get quartiles
                tempVarDump.sort(function(a,b){
                    return a-b
                });
            
                var max = Number(quantile(tempVarDump,1));
            
                var q3Temp = quantile(tempVarDump,0.75);
                var q3 = Number(q3Temp);
            
                var medianTemp = quantile(tempVarDump,0.5);
                var median = Number(medianTemp);          
            
                var q1Temp = quantile(tempVarDump,0.25);
                var q1 = Number(q1Temp);
            
                var min = quantile(tempVarDump,0);
            
                var InterQuartile = Number(q3 - q1);
                // 2 different ways to filter outliers
                var UpperLimit = Number(q3 + (1.5 * InterQuartile));
                var LowerLimit = Number(q1 - (1.5 * InterQuartile));
                var upperLimit = Number(avg + (1.8 * standD));
                var lowerLimit = Number(avg - (1.8 * standD));
            
                function outliers(element, index, array) {
                    return (element > UpperLimit || element < LowerLimit);
                }
                var filteredVarDump = tempVarDump.filter(outliers);
            
                tempStatObject[plotVariable] = {
                    "max":max,
                    "q3":q3,
                    "median":median,
                    "q1":q1,
                    "min":min,
                    "standD":standD,
                    "average":avg,
                    "outliers":filteredVarDump
                };
            
                tempVarDump = [];
            }
            currentDimensionStats = tempStatObject;
        
            shadeChoropleth();
            
            var svg = d3.select("#boxplotArea").append("svg:svg")
            .attr("id", "boxplotSvg")
            .attr("width", widthBoxplotPlot + marginBoxplotPlot[1] + marginBoxplotPlot[3])
            .attr("height", heightBoxplotPlot + marginBoxplotPlot[0] + marginBoxplotPlot[2])
            .append("svg:g")
            .attr("id","boxplotPlot")
            .attr("transform", "translate(" + marginBoxplotPlot[3] + "," + marginBoxplotPlot[0] + ")");
            
            drawBoxplot(false);
            
            var svg2 = d3.select("#scatterplotArea").append("svg:svg")
            .attr("id", "scatterplotSvg")
            .attr("width", widthScatterplotPlot + marginScatterplotPlot[1] + marginScatterplotPlot[3])
            .attr("height", heightScatterplotPlot + marginScatterplotPlot[0] + marginScatterplotPlot[2])
            .append("svg:g")
            .attr("id","scatterplotPlot")
            .attr("transform", "translate(" + marginScatterplotPlot[3] + "," + marginScatterplotPlot[0] + ")");
            
            drawScatterplot(false);
                     
        /*************** ************************************* ********************/
        
        //$('#loadingDiv').fadeOut(100);
        }
    });
}

function processMoran(){
    $('#loadingDiv').fadeIn(100);
    
    $.ajax({
        url: './MoranRCtrl',  
        data:{
            action:"MoransProcessing",
            contiguity: $("input:radio[name='contiguityType']:checked").val()
           // analysis: $("input:radio[name='analysisType']:checked").val()
           // weight: $("input:radio[name='weight']:checked").val(),
           // numOfNeighbours: $("#numberOfNeighbours").val()
        },
        dataType: 'JSON',
        async: true,  
        success: function(data){
            
            var data0 = data.csvData;
            
            processedData = data0;
            globalMoranData = data.globalMoran;
        
            // Extract the list of dimensions and create a scale for each for the boxplot.
            variableBoxplotNameScale.domain(dimensions = d3.keys(processedData[0]).filter(function(d) {
                return d != "Province" && d!="Variable" && d!="FIPS_CNTRY" && (xAxisBoxplotScale[d] = d3.scale.linear()
                    .domain(d3.extent(processedData, function(p) {
                        return +p[d];
                    }))
                    .range([0, widthBoxplotPlot]));
            }));
            
            // Extract the list of dimensions and create a scale for each for the scatterplot.
            variableScatterplotNameScale.domain(dimensions = d3.keys(processedData[0]).filter(function(d) {
                
                return d != "Province" && d!="Variable" && d!="FIPS_CNTRY"// && d.toString().indexOf("_Iisig")==-1
                && (xAxisScatterplotScale[d] = d3.scale.linear()
                    .domain(d3.extent(processedData, function(p) {
                        return +p[d];
                    }))
                    .range([0, widthScatterplotPlot]));
            }));
            
            variableScatterplotYNameScale.domain(moranDimensions = d3.keys(processedData[0]).filter(function(d) {
                return d != "Province" && d!="Variable" && d!="FIPS_CNTRY" && d.toString().indexOf("_lagged")>-1
                && (yAxisScatterplotScale[d] = d3.scale.linear()
                    .domain(d3.extent(processedData, function(p) {
                        //if(d.toString().indexOf("_Iisig")==-1){
                        return +p[d];
                    //}
                    }))
                    .range([heightScatterplotPlot, 0]));
            }));
        
            /*************** Calculating the BoxPlot Statistics for ********************/
        
            var tempStatObject = {};
            // Stores a temp "dump" of data to calcuate each statatics
            var tempVarDump = [];
        
            for (var plotVarKey in dimensions){
                var plotVariable = dimensions[plotVarKey];
            
                //******** ADDED THIS TO POPULATE DIMENSION DROPLIST *********
                
                /*if(plotVariable.indexOf("_Ii")==-1){
                    var optionString = "<option value=\""+plotVariable+"\">"+plotVariable+"</option>";
                
                    $('#selectedDroplist').html($('#selectedDroplist').html()+optionString);                    
                }*/
                
                //************************************************************
            
                var sumTotal = 0;
            
                for (var i=0;i<processedData.length;i++){
                    tempVarDump.push(processedData[i][plotVariable]);
                
                    sumTotal += parseFloat(processedData[i][plotVariable]);
                }
            
                var avg = sumTotal / processedData.length;
            
                var variance = 0;
                for (var j=0;i<processedData.length;j++){
                    variance += Math.pow((parseFloat(processedData[j][plotVariable]) - avg), 2);
                }
            
                variance = variance / processedData.length;
            
                var standD = Math.sqrt(variance);
            
                // need to sort array before can get quartiles
                tempVarDump.sort(function(a,b){
                    return a-b
                });
            
                var max = Number(quantile(tempVarDump,1));
            
                var q3Temp = quantile(tempVarDump,0.75);
                var q3 = Number(q3Temp);
            
                var medianTemp = quantile(tempVarDump,0.5);
                var median = Number(medianTemp);          
            
                var q1Temp = quantile(tempVarDump,0.25);
                var q1 = Number(q1Temp);
            
                var min = quantile(tempVarDump,0);
            
                var InterQuartile = Number(q3 - q1);
                // 2 different ways to filter outliers
                var UpperLimit = Number(q3 + (1.5 * InterQuartile));
                var LowerLimit = Number(q1 - (1.5 * InterQuartile));
                var upperLimit = Number(avg + (1.8 * standD));
                var lowerLimit = Number(avg - (1.8 * standD));
            
                function outliers(element, index, array) {
                    return (element > UpperLimit || element < LowerLimit);
                }
                var filteredVarDump = tempVarDump.filter(outliers);
            
                tempStatObject[plotVariable] = {
                    "max":max,
                    "q3":q3,
                    "median":median,
                    "q1":q1,
                    "min":min,
                    "standD":standD,
                    "average":avg,
                    "outliers":filteredVarDump
                };
            
                tempVarDump = [];
            }
            currentDimensionStats = tempStatObject;
            
            shadeChoropleth();
            if(d3.select("#moranMapType").text().indexOf("Cluster Map")>-1){
                shadeMoranMaps("clusterMap");
            }else{
                shadeMoranMaps("sigMap");
            }

            drawBoxplot(true);
            drawScatterplot(true);
            $('#loadingDiv').fadeOut(100);
        }
    });
}

function updatePlots(){
    shadeChoropleth();
    if(d3.select("#moranMapType").text().indexOf("Cluster Map")>-1){
        shadeMoranMaps("clusterMap");
    }else{
        shadeMoranMaps("sigMap");
    }
    
    drawBoxplot(true);
    drawScatterplot(true);
}

function updateAnalysisType(){
    var analysisType = $("input:radio[name='analysis']:checked").val();
    if(analysisType === "geary") {
        $('#gearyResult').show();
        $('#moranResult').hide();
        processMoran();
    } else {
        $('#moranResult').show();
        $('#gearyResult').hide();
    }
}

// Finds the quartiles of a sorted array (because the one provided by d3.js has some issues)
function quantile(numberArray, percentile){
    var size = numberArray.length;
    var position;
    if(percentile == 0){
        position = 0;
    }else if(percentile == 0.5 && size%2 != 0){
        var pos1 = Math.ceil(size*percentile)-1;
        var pos2 = Math.floor(size*percentile)-1;
        var median = (Number(numberArray[pos1])+Number(numberArray[pos2]))/2;
        //alert(median);
        return median;
    }else{
        position = Math.round(size*percentile)-1;
    }
    
    return numberArray[position];
}

// Checks if there are more than 1 decimal place (because the output of d3 median and quantile can give multiple decimals)
function hasMultipleDecimal(stringInput){
    var decimalCount = stringInput.split(".").length - 1;
    if(decimalCount > 1){
        return true;
    }else{
        return false;
    }
}

function drawBoxplot(isRedraw) {
    // Set color and width of lines
    var array = currentDimensionStats;
    // Height of boxplot position
    var boxplotYAxisPlacement = heightBoxplotPlot/4;
    var brushThickness = 39;
    
    var currentDimension = $('#selectedDroplist option:selected').val();
    $('#globalMoranStat').text(d3.format('.6f')(globalMoranData[currentDimension]["globalMoran"]));
    $('#globalMoranSig').text(d3.format('.6f')(globalMoranData[currentDimension]["globalMoranSig"]));    
    
    var svgMain = d3.select("#boxplotPlot")
    
    var offset = 20;
    var boxplotAxisOffset = offset*2 + 5;
    
    d3.selectAll("#boxplotAxisTitle").remove();
    
    var currentDimension = $('#selectedDroplist option:selected').val();
    
    svgMain.append('svg:text')
    .attr('id', 'boxplotAxisTitle')
    .attr('class', 'axisTitle')
    .attr('x', widthBoxplotPlot/2)
    .attr('y', heightBoxplotPlot + 5)
    .attr('text-anchor', 'middle')
    .text(currentDimension);    
            
    // retrieve statistical values
    var Maximum = array[currentDimension].max;
    var Minimum = array[currentDimension].min;
    var Median = array[currentDimension].median;
    var FirstQuar = array[currentDimension].q1;
    var ThirdQuar = array[currentDimension].q3;
    var StandD = array[currentDimension].standD;
    var Average = array[currentDimension].average;
    var Outliers = array[currentDimension].outliers;
        
    var InterQuartile = ThirdQuar - FirstQuar;
    var UpperLimit = ThirdQuar + (1.5 * InterQuartile);
    var LowerLimit = FirstQuar - (1.5 * InterQuartile);
    var upperLimit = Average + (1.8 * StandD);
    var lowerLimit = Average - (1.8 * StandD);
        
    if(UpperLimit > Maximum){
        UpperLimit = Maximum;
    }
        
    if(LowerLimit < Minimum){
        LowerLimit = Minimum;
    }
        
    // convert values to account for opposite in scale
    var cMax = convertToValue(Maximum,currentDimension);
    var cMin = convertToValue(Minimum,currentDimension);
    var cMed = convertToValue(Median,currentDimension);
    var cQ1 = convertToValue(FirstQuar,currentDimension);
    var cQ3 = convertToValue(ThirdQuar,currentDimension);
    var cMean = convertToValue(Average,currentDimension);
    var cOutliers = [];
        
    var cUpperLimit = convertToValue(UpperLimit,currentDimension);
    var cLowerLimit = convertToValue(LowerLimit,currentDimension);
        
    var boxplotAxisFunction = d3.svg.axis()
    .scale(xAxisBoxplotScale[currentDimension])
    .orient("bottom")
    .ticks(8);
            
    d3.select('#boxplotAxis').remove();
    svgMain.append('g')
    .attr("id","boxplotAxis")
    .attr("class","axis")
    .attr("transform","translate(0,"+boxplotAxisOffset+")")
    .call(boxplotAxisFunction);
                
        
    if(isRedraw){
                
        d3.select('#center')
        .transition()
        .duration(transitionDuration)
        .attr("x1", cLowerLimit)
        .attr("y1", boxplotYAxisPlacement)
        .attr("x2", cUpperLimit)
        .attr("y2", boxplotYAxisPlacement);
                
        d3.select('#left')
        .transition()
        .duration(transitionDuration)
        .attr("x1", cQ3)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cQ1)
        .attr("y2", boxplotYAxisPlacement - offset)

        d3.select('#right')
        .transition()
        .duration(transitionDuration)
        .attr("x1", cQ3)
        .attr("y1", boxplotYAxisPlacement + offset)
        .attr("x2", cQ1)
        .attr("y2", boxplotYAxisPlacement + offset)

        d3.select('#median')
        .transition()
        .duration(transitionDuration)
        .attr("x1", cMed)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cMed)
        .attr("y2", boxplotYAxisPlacement + offset)

        d3.select('#max')
        .transition()
        .duration(transitionDuration)
        .attr("x1", cUpperLimit)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cUpperLimit)
        .attr("y2", boxplotYAxisPlacement + offset)

        d3.select('#min')
        .transition()
        .duration(transitionDuration)
        .attr("x1", cLowerLimit)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cLowerLimit)
        .attr("y2", boxplotYAxisPlacement + offset)

        d3.select('#top')
        .transition()
        .duration(transitionDuration)
        .attr("x1", cQ3)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cQ3)
        .attr("y2", boxplotYAxisPlacement + offset)

        d3.select('#bottom')
        .transition()
        .duration(transitionDuration)
        .attr("x1", cQ1)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cQ1)
        .attr("y2", boxplotYAxisPlacement + offset)
                
        d3.selectAll('.boxplotPoints')
        .transition()
        .duration(transitionDuration)
        .attr("transform", function(d) {
            return "translate(" + xAxisBoxplotScale[currentDimension](d[currentDimension]) + "," + boxplotYAxisPlacement + ")";
        });
                
    }else{
        svgMain.append("line")
        .attr("id", "center")
        .attr("class", "boxplot")
        .attr("x1", cLowerLimit)
        .attr("y1", boxplotYAxisPlacement)
        .attr("x2", cUpperLimit)
        .attr("y2", boxplotYAxisPlacement)            

        svgMain.append("line")
        .attr("id", "left")
        .attr("class", "boxplot")
        .attr("x1", cQ3)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cQ1)
        .attr("y2", boxplotYAxisPlacement - offset)

        svgMain.append("line")
        .attr("id", "right")
        .attr("class", "boxplot")
        .attr("x1", cQ3)
        .attr("y1", boxplotYAxisPlacement + offset)
        .attr("x2", cQ1)
        .attr("y2", boxplotYAxisPlacement + offset)

        svgMain.append("line")
        .attr("id", "median")
        .attr("class", "boxplot")
        .attr("x1", cMed)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cMed)
        .attr("y2", boxplotYAxisPlacement + offset)

        svgMain.append("line")
        .attr("id", "max")
        .attr("class", "boxplot")
        .attr("x1", cUpperLimit)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cUpperLimit)
        .attr("y2", boxplotYAxisPlacement + offset)

        svgMain.append("line")
        .attr("id", "min")
        .attr("class", "boxplot")
        .attr("x1", cLowerLimit)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cLowerLimit)
        .attr("y2", boxplotYAxisPlacement + offset)

        svgMain.append("line")
        .attr("id", "top")
        .attr("class", "boxplot")
        .attr("x1", cQ3)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cQ3)
        .attr("y2", boxplotYAxisPlacement + offset)

        svgMain.append("line")
        .attr("id", "bottom")
        .attr("class", "boxplot")
        .attr("x1", cQ1)
        .attr("y1", boxplotYAxisPlacement - offset)
        .attr("x2", cQ1)
        .attr("y2", boxplotYAxisPlacement + offset)
        
        //svgMain.append("line")
        
        var circle = svgMain.append("g").selectAll("circle")
        .data(processedData)
        .enter().append("circle")
        .attr("class","boxplotPoints")
        .attr("id", processedData ? identifyBoxplot : null)
        .attr("transform", function(d) {
            return "translate(" + xAxisBoxplotScale[currentDimension](d[currentDimension]) + "," + boxplotYAxisPlacement + ")";
        })
        .attr("r", 2.5);
    }
            
    boxplotBrush = d3.svg.brush().x(xAxisBoxplotScale[currentDimension])
    .on("brushstart", brushstart)
    .on("brush", brushmove)
    .on("brushend", brushend);
            
    d3.selectAll('#boxplotBrush').remove();
    svgMain.append("g")
    .attr("id","boxplotBrush")
    .attr("class", "brush")
    .call(boxplotBrush)
    .selectAll("rect")
    .attr("transform", function(d) {
        return "translate(0,"+ (boxplotYAxisPlacement - brushThickness/2) +")"
    })
    .attr("height", brushThickness);
    
    function brushstart() {
        d3.select('#scatterplotBrush').call(scatterplotBrush.clear());
        d3.selectAll(".scatterplotPoints").classed("selected",false);      
        d3.select("#scatterplotPlot").classed("selecting", true);
        svgMain.classed("selecting", true);
        provSelectCount = 0;
    }

    function brushmove() {
        var s = d3.event.target.extent();
        d3.selectAll('.boxplotPoints').classed("selected", function(d) {
            if(s[0] <= d[currentDimension] && d[currentDimension] <= s[1]){
                $('#p'+d['FIPS_CNTRY']).css('fill','rgba(124,240,10,0.0)');
                $('#m'+d['FIPS_CNTRY']).css('fill','rgba(124,240,10,0.0)');
                d3.select('#s'+d['FIPS_CNTRY']).classed("selected",true);
            }else{
                $('#p'+d['FIPS_CNTRY']).css('fill','');
                $('#m'+d['FIPS_CNTRY']).css('fill','');
                d3.select('#s'+d['FIPS_CNTRY']).classed("selected",false);
            }
            return s[0] <= d[currentDimension] && d[currentDimension] <= s[1];
        });
    }

    function brushend() {
        if(d3.event.target.empty()){
            $('#counties > path').css('fill','rgba(124,240,10,0.0)');
            $('#counties_mi > path').css('fill','rgba(124,240,10,0.0)');
            d3.selectAll(".scatterplotPoints").classed("selected",false);
        }
        
        svgMain.classed("selecting", !d3.event.target.empty());
        
        if(!(d3.select("#boxplotPlot").attr("class")=="selecting")){
            d3.select("#scatterplotPlot").classed("selecting", false);
        }         
    }
    
}

function drawScatterplot(isRedraw) {
    // Set color and width of lines
    var array = currentDimensionStats;
    
    var svgMain = d3.select("#scatterplotPlot")
    
    var xOffset = 10;
    var scatterplotXAxisOffset = heightScatterplotPlot - xOffset;
    var scatterplotYAxisOffset = -xOffset;
    
    d3.selectAll("#scatterplotXAxisTitle").remove();
    d3.selectAll("#scatterplotYAxisTitle").remove();
    
    svgMain.append('svg:text')
    .attr('id','scatterplotXAxisTitle')
    .attr('class', 'axisTitle')
    .attr('x', widthScatterplotPlot/2)
    .attr('y', heightScatterplotPlot + xOffset*2.5)
    .attr('text-anchor', 'middle')
    .text($('#selectedDroplist option:selected').val());
            
    svgMain.append('svg:text')
    .attr('id','scatterplotYAxisTitle')
    .attr('class', 'axisTitle')
    .attr('x', - heightScatterplotPlot/2)
    .attr('y', - xOffset*6)
    .attr('text-anchor', 'middle')
    .attr('transform',"rotate(-90)")
    .text("lagged " + $('#selectedDroplist option:selected').val());
    
    var currentDimension = $('#selectedDroplist option:selected').val();
    var moranAverage = array[currentDimension+"_lagged"].average;
            
    var Average = array[currentDimension].average;
        
    var boxplotXAxisFunction = d3.svg.axis()
    .scale(xAxisScatterplotScale[currentDimension])
    .orient("bottom")
    .ticks(8);
            
    var boxplotYAxisFunction = d3.svg.axis()
    .scale(yAxisScatterplotScale[currentDimension+"_lagged"])
    .orient("left")
    .ticks(8);
            
    d3.select('#scatterplotXAxis').remove();
    svgMain.append('g')
    .attr("id","scatterplotXAxis")
    .attr("class","axis")
    .attr("transform","translate(0,"+scatterplotXAxisOffset+")")
    .call(boxplotXAxisFunction);
            
    d3.select('#scatterplotYAxis').remove();
    svgMain.append('g')
    .attr("id","scatterplotYAxis")
    .attr("class","axis")
    .attr("transform","translate(0,"+scatterplotYAxisOffset+")")
    .call(boxplotYAxisFunction);
            
    if(isRedraw){
                
        d3.select('#xAxisAvg')
        .transition()
        .duration(transitionDuration)
        .attr("x1", xAxisScatterplotScale[currentDimension](Average))
        .attr("y1", -10)
        .attr("x2", xAxisScatterplotScale[currentDimension](Average))
        .attr("y2", heightScatterplotPlot-10);       
        
        d3.select('#yAxisAvg')
        .transition()
        .duration(transitionDuration)
        .attr("x1", 0)
        .attr("y1", scatterplotYAxisOffset+yAxisScatterplotScale[currentDimension+"_lagged"](moranAverage))
        .attr("x2", widthScatterplotPlot)
        .attr("y2", scatterplotYAxisOffset+yAxisScatterplotScale[currentDimension+"_lagged"](moranAverage));           
                
        d3.selectAll('.scatterplotPoints')
        .data(processedData)
        .transition()
        .duration(transitionDuration)
        .attr("transform", function(d) {
            return "translate(" + xAxisScatterplotScale[currentDimension](d[currentDimension]) 
            + "," + (scatterplotYAxisOffset + yAxisScatterplotScale[currentDimension+"_lagged"](d[currentDimension+"_lagged"])) + ")";
        });
                
    }else{
        
        svgMain.append("line")
        .attr("id", "xAxisAvg")
        .attr("class", "avgLine")
        .attr("x1", xAxisScatterplotScale[currentDimension](Average))
        .attr("y1", -10)
        .attr("x2", xAxisScatterplotScale[currentDimension](Average))
        .attr("y2", heightScatterplotPlot-10);        
        
        svgMain.append("line")
        .attr("id", "yAxisAvg")
        .attr("class", "avgLine")
        .attr("x1", 0)
        .attr("y1", scatterplotYAxisOffset+yAxisScatterplotScale[currentDimension+"_lagged"](moranAverage))
        .attr("x2", widthScatterplotPlot)
        .attr("y2", scatterplotYAxisOffset+yAxisScatterplotScale[currentDimension+"_lagged"](moranAverage));          
        
        var circle = svgMain.append("g").selectAll("circle")
        .data(processedData)
        .enter().append("circle")
        .attr("class","scatterplotPoints")
        .attr("id", processedData ? identifyScatterplot : null)
        .attr("transform", function(d) {
            return "translate(" + xAxisScatterplotScale[currentDimension](d[currentDimension]) 
            + "," + (scatterplotYAxisOffset + yAxisScatterplotScale[currentDimension+"_lagged"](d[currentDimension+"_lagged"])) + ")";
        })
        .attr("r", 2.5);
    }
            
    scatterplotBrush = d3.svg.brush().x(xAxisScatterplotScale[currentDimension]).y(yAxisScatterplotScale[currentDimension+"_lagged"])
    .on("brushstart", brushstart)
    .on("brush", brushmove)
    .on("brushend", brushend)
            
    d3.selectAll('#scatterplotBrush').remove();
    svgMain.append("g")
    .attr("id","scatterplotBrush")
    .attr("class", "brush")
    .attr("transform","translate(0,"+ -xOffset +")")
    .call(scatterplotBrush);  
    
    function brushstart() {
        d3.select('#boxplotBrush').call(boxplotBrush.clear());
        d3.selectAll(".boxplotPoints").classed("selected",false)
        d3.select('#boxplotPlot').classed("selecting", true);
        svgMain.classed("selecting", true);
        provSelectCount = 0;
    }

    function brushmove() {
        var s = d3.event.target.extent();
        d3.selectAll('.scatterplotPoints').classed("selected", function(d) {
            if(s[0][0] <= d[currentDimension] && d[currentDimension] <= s[1][0]
                && s[0][1] <= d[currentDimension+"_lagged"] && d[currentDimension+"_lagged"] <= s[1][1]){
                $('#p'+d['FIPS_CNTRY']).css('fill','rgba(124,240,10,0.0)');
                $('#m'+d['FIPS_CNTRY']).css('fill','rgba(124,240,10,0.0)');
                d3.select('#b'+d['FIPS_CNTRY']).classed("selected",true);
            }else{
                $('#p'+d['FIPS_CNTRY']).css('fill','');
                $('#m'+d['FIPS_CNTRY']).css('fill','');
                d3.select('#b'+d['FIPS_CNTRY']).classed("selected",false);
            }
            return s[0][0] <= d[currentDimension] && d[currentDimension] <= s[1][0] && 
            s[0][1] <= d[currentDimension+"_lagged"] && d[currentDimension+"_lagged"] <= s[1][1];
        });
    }

    function brushend() {
        if(d3.event.target.empty()){
            $('#counties path').css('fill','rgba(124,240,10,0.0)');
            $('#counties_mi path').css('fill','rgba(124,240,10,0.0)');
            d3.selectAll('.boxplotPoints').classed("selected",false);
        }
        
        svgMain.classed("selecting", !d3.event.target.empty());
        
        if(!(d3.select('#scatterplotPlot').attr("class")=="selecting")){
            d3.select('#boxplotPlot').classed("selecting", false);
        }
    }
    
}

// Function to help set the identifier
function identifyBoxplot(d) {
    return "b" + d.FIPS_CNTRY;
}       

// Function to help set the identifier
function identifyScatterplot(d) {
    return "s" + d.FIPS_CNTRY;
}    
    
function position(d) {
    var v = dragging[d];
    return v == null ? x(d) : v;
}
    
// Returns the path for a given data point.
function path(d) {
    return line(dimensions.map(function(p) {
        return [position(p), xAxisBoxplotScale[p](d[p])];
    }));
}

function convertToValue(value, varName) {
    value = xAxisBoxplotScale[varName](value);
    return value;
}

function reshadeChoropleth(dimensionStats){
    $('#selectedDim').html(dimensionStats);
    
    shadeChoropleth();
}

function goToClusterView(){
    $('#moranMapType').html("Cluster Map");
    shadeMoranMaps("clusterMap");
    $('#toCluster').fadeOut(200);
    $('#toSig').fadeIn(200);
//shadeChoropleth();
}

function goToSigView(){
    $('#moranMapType').html("Significance Map");
    shadeMoranMaps("sigMap");
    $('#toSig').fadeOut(200);
    $('#toCluster').fadeIn(200);
//shadeChoropleth();
}

function shadeMoranMaps(mapType){
    var selectedDim = $('#selectedDroplist option:selected').val();
    var dimStats = currentDimensionStats[selectedDim];
    var moranDimStats = currentDimensionStats[selectedDim+"_lagged"];
    var sigDimStats = currentDimensionStats[selectedDim+"_Iisig"];
        
    var dimRange = parseFloat(dimStats['max'])-parseFloat(dimStats['min']);
    var dimMin = parseFloat(dimStats['min']);
    
    /**** Instantiating the Choropleth Legend objects ****/
    $('#choropleth_legend_mi').html("");
    
    var svg = d3.select('#choropleth_legend_mi').append('svg:svg').attr('height','500');

    var legend = svg.append('svg:g').attr('transform', 'translate(15, 300)');//.attr('transform', 'translate(904, 240)');
    var legendGradient = legend.append('svg:g');//.attr('id','gradient')
    var legendTicks = legend.append('svg:g');
    
    legend.append('svg:text')
    .attr('class', 'legend-title')
    .attr('x', -5)
    .attr('y', -10)
    .text('Legend');
    
    if(mapType == "clusterMap"){
        
        legendTicks.selectAll('text')
        .data(["High-High","Low-Low","High-Low","Low-High","Not Significant"])
        .enter()
        .insert('svg:text')
        .attr('class', 'legend-tick')
        .attr('text-anchor', 'start')
        .attr('x', legendGradientWidth + 7)
        .attr('y', function (d, i) {
            return (i+0.5) * (legendGradientHeight/6) + 5;
        })
        .text(function(d, i) {
            return d;
        });
        
        legendGradient.selectAll('rect')
        .data(["#FF0000","#0000FF","#FF7373","#7373FF",nonSignificantColor])
        .enter()
        .insert('svg:rect')
        .attr('x', 1)
        .attr('y', function (d, i) {
            //zeroPosition = i;
            return (i+0.1) * (legendGradientHeight/6) + 5;
        })
        .attr('width', legendGradientWidth)
        .attr('height', 15)
        .style('fill', function (d, i) {
            return d;
        })
        .style('stroke', "grey")
        .style('stroke-width', "0.5px");
        
        var highLowColor;
        
        for (i=0;i<processedData.length;i++){
            
            if(processedData[i][selectedDim+"_Iisig"]>significanceThreshold){
                highLowColor = nonSignificantColor;
            }else{
                if(processedData[i][selectedDim] >= dimStats["average"] && processedData[i][selectedDim+"_lagged"] >= moranDimStats["average"]){
                    highLowColor = "#FF0000";
                }else if(processedData[i][selectedDim] < dimStats["average"] && processedData[i][selectedDim+"_lagged"] < moranDimStats["average"]){
                    highLowColor = "#0000FF";
                }else if(processedData[i][selectedDim] >= dimStats["average"] && processedData[i][selectedDim+"_lagged"] < moranDimStats["average"]){
                    highLowColor = "#FF7373";
                }else if(processedData[i][selectedDim] < dimStats["average"] && processedData[i][selectedDim+"_lagged"] >= moranDimStats["average"]){
                    highLowColor = "#7373FF";
                }                 
            }    
            
            
            d3.select('#cpmmi'+processedData[i]["FIPS_CNTRY"])
            .transition()
            .duration(transitionDuration)
            .attr('fill',highLowColor);
        }        
        
    }else if(mapType == "sigMap"){
        
        legendTicks.selectAll('text')
        .data(["0.00",significanceThreshold/3,significanceThreshold*2/3,significanceThreshold,"Not Significant"])
        .enter()
        .insert('svg:text')
        .attr('class', 'legend-tick')
        .attr('text-anchor', 'start')
        .attr('x', legendGradientWidth + 7)
        .attr('y', function (d, i) {
            return i * (legendGradientHeight/4) + 5;
        })
        .text(function(d) {
            if(isNaN(d3.format('.3f')(d))){
                return d;
            }else{
                return d3.format('.3f')(d);
            }
        });
    
        /****  ****/
    
        legendGradient.selectAll('rect')
        .data(d3.range(0.1,0.6,0.008333333333334))
        .enter()
        .insert('svg:rect')
        .attr('x', 1)
        .attr('y', function (d, i) {
            //zeroPosition = i;
            return i * 2;
        })
        .attr('width', legendGradientWidth)
        .attr('height', 2)
        .style('fill', function (d, i) {
            return d3.hsl(120, 1, d);
        });
        
        legendGradient.append('svg:rect')
        .attr('x', 1)
        .attr('y', (5.5) * (legendGradientHeight/6) + 5)
        .attr('width', legendGradientWidth)
        .attr('height', 15)
        .style('fill', nonSignificantColor)
        .style('stroke', "grey")
        .style('stroke-width', "0.5px");
        ;
    
        /**** Declaring the Choropleth Color Scale objects ****/
        var singleColorScaler;
        
        singleColorScaler = percent_scale.domain([0,significanceThreshold]);
            
        for (i=0;i<processedData.length;i++){
            //$('#cpm'+processedData[i]["FIPS_CNTRY"]).css('fill',convertPercentToColor(1,singleColorScaler(processedData[i][selectedDim])));
            d3.select('#cpmmi'+processedData[i]["FIPS_CNTRY"])
            .transition()
            .duration(transitionDuration)
            .attr('fill',function(){
                if(processedData[i][selectedDim+"_Iisig"]<=significanceThreshold){
                    return d3.hsl(120, 1.00, parseFloat(singleColorScaler(processedData[i][selectedDim+"_Iisig"])));
                }else{
                    return nonSignificantColor;
                }
            });
        };
        
        legend.append('svg:rect')
        .attr('y', 0)
        .attr('x', 1)
        .attr('width', legendGradientWidth)
        .attr('height', legendGradientHeight*3/4)
        .style('fill', 'none')
        .style('stroke', '#A4A4A4')
        .style('shape-rendering', 'crispEdges');        
    }
    
}
    
function shadeChoropleth(){
    if(currentDimensionStats === undefined || $('#selectedDroplist option:selected').val()==""){
        alert("There is no data loaded. Return to the Upload page to load the required data.");
    }else{
        //var selectedDim = $('#selectedDim').html();
        var selectedDim = $('#selectedDroplist option:selected').val();
        
        var dimStats = currentDimensionStats[selectedDim];        
        
        var dimRange = parseFloat(dimStats['max'])-parseFloat(dimStats['min']);
        var dimMin = parseFloat(dimStats['min']);
    
        /**** Instantiating the Choropleth Legend objects ****/
        $('#choropleth_legend').html("");
    
        var svg = d3.select('#choropleth_legend').append('svg:svg').attr('height','500');

        var legend = svg.append('svg:g').attr('transform', 'translate(15, 300)');//.attr('transform', 'translate(904, 240)');
        var legendGradient = legend.append('svg:g');//.attr('id','gradient')
        var legendGradient2 = legend.append('svg:g');
        var legendTicks = legend.append('svg:g');
    
        legend.append('svg:text')
        .attr('class', 'legend-title')
        .attr('x', -5)
        .attr('y', -10)
        .text('Legend');
        
        legendTicks.selectAll('text')
        .data([dimStats['max'],dimMin+dimRange*3/4,dimMin+dimRange/2,dimMin+dimRange/4,dimStats['min']])
        .enter()
        .insert('svg:text')
        .attr('class', 'legend-tick')
        .attr('text-anchor', 'start')
        .attr('x', legendGradientWidth + 7)
        .attr('y', function (d, i) {
            return i * (legendGradientHeight/4) + 5;
        })
        .text(function(d, i) {
            return d3.format('.2f')(d);
        });
        /****  ****/
    
        /**** Declaring the Choropleth Color Scale objects ****/
        var positiveColorScaler;
        var negativeColorScaler;
        var singleColorScaler;
        /****  ****/
    
        /**** Shading of the Choropleth Map and Legend based on the "sign" of the value ranges ****/
        // Checks if both the max and min are positive or negative
        if(dimStats['max']*dimStats['min']>=0){
        
            singleColorScaler = percent_scale.domain([dimStats['min'],dimStats['max']]);
            
            for (i=0;i<processedData.length;i++){
                if(dimStats['max']>0){
                    //$('#cpm'+processedData[i]["FIPS_CNTRY"]).css('fill',convertPercentToColor(1,singleColorScaler(processedData[i][selectedDim])));
                    d3.select('#cpm'+processedData[i]["FIPS_CNTRY"])
                    .transition()
                    .duration(transitionDuration)
                    .attr('fill',convertPercentToColor(1,singleColorScaler(processedData[i][selectedDim])));
                }else{
                    //$('#cpm'+processedData[i]["FIPS_CNTRY"]).css('fill',convertPercentToColor(-1,singleColorScaler(processedData[i][selectedDim])));
                    d3.select('#cpm'+processedData[i]["FIPS_CNTRY"])
                    .transition()
                    .duration(transitionDuration)
                    .attr('fill',convertPercentToColor(-1,singleColorScaler(processedData[i][selectedDim])));
                }   
            }
        
            if(dimStats['max']>0){
                legendGradient.selectAll('rect')
                .data(d3.range(lowestLightness,highestLightness,0.01))
                .enter()
                .insert('svg:rect')
                .attr('x', 1)
                .attr('y', function (d, i) {
                    //zeroPosition = i;
                    return i * 2;
                })
                .attr('width', legendGradientWidth)
                .attr('height', 2)
                .style('fill', function (d, i) {
                    return d3.hsl(postiveHue, 1, d+(1-highestLightness));
                });
            }else{
                legendGradient2.selectAll('rect')
                .data(d3.range(lowestLightness,highestLightness,0.01))
                .enter()
                .insert('svg:rect')
                .attr('x', 1)
                .attr('y', function (d, i) {
                    return i * 2;
                })
                .attr('width', legendGradientWidth)
                .attr('height', 2)
                .style('fill', function (d, i) {
                    return d3.hsl(negativeHue, 1, 1-d);
                });
            }
        
        }else{
        
            var topRatio = dimStats['max']/(Math.abs(dimStats['min'])+dimStats['max']);
            if(Math.abs(dimStats['min']) > dimStats['max']){
                positiveColorScaler = d3.scale.linear().range([lowestLightness,(highestLightness*dimStats['max'])/(Math.abs(dimStats['min']))]).domain([0,dimStats['max']]);
                negativeColorScaler = d3.scale.linear().range([lowestLightness,highestLightness]).domain([dimStats['min'],0]);      
                positiveWeight = dimStats['max']/Math.abs(dimStats['min']);
                negativeWeight = 1;
            }else{
                positiveColorScaler = d3.scale.linear().range([lowestLightness,highestLightness]).domain([0,dimStats['max']]);
                negativeColorScaler = d3.scale.linear().range([lowestLightness,(highestLightness*Math.abs(dimStats['min']))/(dimStats['max'])]).domain([dimStats['min'],0]);        
                positiveWeight = 1;
                negativeWeight = Math.abs(dimStats['min'])/(dimStats['max']);
            }
        
            for (var i=0;i<processedData.length;i++){
                if(parseFloat(processedData[i][selectedDim])>0){
                    //$('#cpm'+processedData[i]["FIPS_CNTRY"]).css('fill',convertPercentToColor(1,positiveColorScaler(parseFloat(processedData[i][selectedDim]))));
                    d3.select('#cpm'+processedData[i]["FIPS_CNTRY"])
                    .transition()
                    .duration(transitionDuration)
                    .attr('fill',convertPercentToColor(1,positiveColorScaler(parseFloat(processedData[i][selectedDim]))));
                }else{
                    //$('#cpm'+processedData[i]["FIPS_CNTRY"]).css('fill',convertPercentToColor(-1,negativeColorScaler(parseFloat(processedData[i][selectedDim]))));
                    d3.select('#cpm'+processedData[i]["FIPS_CNTRY"])
                    .transition()
                    .duration(transitionDuration)
                    .attr('fill',convertPercentToColor(-1,negativeColorScaler(parseFloat(processedData[i][selectedDim]))));
                }
            }
            var zeroPosition = 0;
        
            legendGradient.selectAll('rect')
            .data(d3.range(lowestLightness,highestLightness*positiveWeight,(highestLightness*positiveWeight-lowestLightness)/(80*topRatio)))
            .enter()
            .insert('svg:rect')
            .attr('x', 1)
            .attr('y', function (d, i) {
                zeroPosition = i;
                return i * 2;
            })
            .attr('width', legendGradientWidth)
            .attr('height', 2)
            .style('fill', function (d, i) {
                return d3.hsl(postiveHue, 1, d+(1-highestLightness*positiveWeight));
            });

            legendGradient2.selectAll('rect')
            .data(d3.range(lowestLightness,highestLightness*negativeWeight,(highestLightness*negativeWeight-lowestLightness)/(80*(1-topRatio))))
            .enter()
            .insert('svg:rect')
            .attr('x', 1)
            .attr('y', function (d, i) {
                return (zeroPosition+i) * 2;
            })
            .attr('width', legendGradientWidth)
            .attr('height', 2)
            .style('fill', function (d, i) {
                return d3.hsl(negativeHue, 1, 1-d);
            });        
        }
    
        legend.append('svg:rect')
        .attr('y', 0)
        .attr('x', 1)
        .attr('width', legendGradientWidth)
        .attr('height', legendGradientHeight)
        .style('fill', 'none')
        .style('stroke', '#A4A4A4')
        .style('shape-rendering', 'crispEdges');
    }
}

function convertPercentToColor(status,percent) {
    var color;
    if(parseInt(status)>0){
        color = d3.hsl(postiveHue, 1.00, 1-parseFloat(percent));
    }else{
        color = d3.hsl(negativeHue, 1.00, (parseFloat(percent)+(1-(highestLightness*negativeWeight))));
    }
    return color;
}