var provSelectCount = 0; //made global variable so parallel coord js can read it

var admDivID = "FIPS_CNTRY"; //adm2code
var admDivName = "i_CNTRY_NA"; //



$(document).ready(function(){
    // ======================= Loading the Map ============================
    var mapData;
    var proj;
    var path;
    var t; // the projection's default translation
    var s; // the projection's scale 
    
    var svg;//for the overlay map
    var svg_mi;
    
    var counties;//for the overlay map
    var counties_mi;//for the overlay map
    
    var svg_choro;//for the choropleth map
    var svg_choro_mi;
    
    var choropleth;// for the choropleth map
    var choropleth_mi;// for the choropleth map
  
    proj = d3.geo.mercator()
    .scale(960 + 1)
    .translate([960 / 2, 960 / 2])
    .precision(.1);
    // path tags created based on the projection given
    path = d3.geo.path().projection(proj);
   
    
    // appends an svg tag to element id=chart
    svg = d3.select("#choropleth_map")
    .append("svg")
    .attr("class","explorationMap")
    .attr("id","zoom");

    // appends a g tag to the svg element
    counties = svg.append("g")
    .attr("id", "country")
    .attr("class", "choro_map");
    
    //----------------------------------
    svg_choro = d3.select("#choropleth_selector")
    .append("svg")
    .attr("class","explorationMap");

    // appends a g tag to the svg element
    choropleth = svg_choro.append("g")
    .attr("id", "choropleth")
    .attr("class", "Blues");
    //*******************************************
    
    // appends an svg tag to element id=chart
    svg_mi = d3.select("#choropleth_map_mi")
    .append("svg")
    .attr("class","explorationMap")
    .attr("id","zoom");

    // appends a g tag to the svg element
    counties_mi = svg_mi.append("g")
    .attr("id", "counties_mi")
    .attr("class", "choro_map");
    
    //------------------------------------
    svg_choro_mi = d3.select("#choropleth_selector_mi")
    .append("svg")
    .attr("class","explorationMap");

    // appends a g tag to the svg element
    choropleth_mi = svg_choro_mi.append("g")
    .attr("id", "choropleth_mi")
    .attr("class", "Blues");
    //*******************************************    

    d3.json("./map2.geojson", function(json) {
                      
        mapData = json.features;
        
        //*******************************************
        choropleth.selectAll("path")
        .data(json.features)
        .enter().append("path")
        .attr("title", mapData ? title : null)
        .attr("prov_name", mapData ? title : null)
        .attr("id", mapData ? identify_choro : null)
        .attr("d", path);
        
        //---------------------------------------
                
        counties.selectAll("path")
        .data(json.features)
        .enter().append("path")
        .attr("title", mapData ? title : null)
        .attr("prov_name", mapData ? title : null)
        .attr("id", mapData ? identify_choro_base : null)
        .attr("d", path);
                
        $("#counties path").tooltip({
            effect: 'fade',
            opacity: 0.8
        });
                
        $('#counties path').css({
            'fill':'rgba(215,0,54,0.0)'
        });
        
        //this function can be found in box_and_scatterplot.js, not here
        
        
        //*******************************************
        
        choropleth_mi.selectAll("path")
        .data(json.features)
        .enter().append("path")
        .attr("title", mapData ? title : null)
        .attr("prov_name", mapData ? title : null)
        .attr("id", mapData ? identify_choro_mi : null)
        .attr("d", path);
        
        //---------------------------------------
                
        counties_mi.selectAll("path")
        .data(json.features)
        .enter().append("path")
        .attr("title", mapData ? title : null)
        .attr("prov_name", mapData ? title : null)
        .attr("id", mapData ? identify_choro_base_mi : null)
        .attr("d", path);
                
        $("#counties_mi path").tooltip({
            effect: 'fade',
            opacity: 0.8
        });
                
        updateCountryMap();
        $('#counties_mi path').css({
            'fill':'rgba(215,0,54,0.0)'
        });
        
        //this function can be found in parallel-coordinates-d3.js, not here
        shadeChoropleth();
        shadeMoranMaps("clusterMap");
        $('#loadingDiv').fadeOut(100);
        
    });

    // ======================= Map functions ============================


    function identify_choro_base(d) {
        return "p" + d.properties[admDivID].toString();
    }
    
    function identify_choro(d) {
        return "cpm" + d.properties[admDivID].toString();
    }

    function identify_choro_base_mi(d) {
        return "m" + d.properties[admDivID].toString();
    }
    
    function identify_choro_mi(d) {
        return "cpmmi" + d.properties[admDivID].toString();
    }

    function title(d) {
       return d.properties[admDivName];
    } 

    function quantize(d) {
        return "q" + Math.min(8, ~~(data[d.id] * 9 / 12)) + "-9";
    }
            
    // ======================= Map-Page Functions ============================
   
    // Function that executes everytime a province is clicked
    function updateCountryMap(){
        $('#counties path').click(function () {
            if(provSelectCount == 0){
                $('#counties path').css({
                    'fill':''
                });
                
                $('#counties_mi path').css({
                    'fill':''
                });                
                
                d3.select("#scatterplotPlot").classed("selecting",false);
                d3.select("#boxplotPlot").classed("selecting",false);                
                d3.selectAll(".scatterplotPoints").classed("selected",false);
                d3.selectAll(".boxplotPoints").classed("selected",false);
                
            }
            
            d3.select('#scatterplotBrush').call(scatterplotBrush.clear());
            d3.select('#boxplotBrush').call(boxplotBrush.clear());

            // Select specific Background line
            var adm2code = this.id.toString().slice(1);
            
            // Ensure that the equivalent value is the same as the default specified in the css or elsewhere
            if(!(d3.select('#b'+adm2code).attr('class')=="boxplotPoints selected") ||
                !(d3.select('#s'+adm2code).attr('class')=="scatterplotPoints selected")){
                $(this).css({
                    'fill':"rgba(124,240,10,0.0)"
                });
                $('#m'+adm2code).css({
                    'fill':"rgba(124,240,10,0.0)"
                });
                

                d3.select("#scatterplotPlot").classed("selecting",true);
                d3.select("#boxplotPlot").classed("selecting",true);
                d3.select('#s'+adm2code).classed("selected",true);
                d3.select('#b'+adm2code).classed("selected",true);
                
                provSelectCount++;
                
            }else{
                $(this).css({
                    'fill':''
                });
                $('#m'+adm2code).css({
                    'fill':''
                });                

                d3.select("#scatterplotPlot").classed("selecting",true);
                d3.select("#boxplotPlot").classed("selecting",true);
                d3.select('#s'+adm2code).classed("selected",false);
                d3.select('#b'+adm2code).classed("selected",false);
                //d3.select('#l'+adm2code).style("stroke","").style("stroke-width","");
                
                provSelectCount--;
                
                if(provSelectCount==0){
                    $('#counties path').css({
                        'fill':"rgba(124,240,10,0.0)"
                    });
                    
                    $('#counties_mi path').css({
                        'fill':"rgba(124,240,10,0.0)"
                    });                             

                    //Shows on Parallel Coord
                    // Hide foreground - using a mixture of jQuery & d3 selectors. No diff between them.
                    d3.select("#scatterplotPlot").classed("selecting",false);
                    d3.select("#boxplotPlot").classed("selecting",false);
                }                
            }
        });
        
        $('#counties_mi path').click(function() {
            
            if(provSelectCount == 0){
                $('#counties path').css({
                    'fill':''
                });
                
                $('#counties_mi path').css({
                    'fill':''
                });                
                
                d3.select("#scatterplotPlot").classed("selecting",false);
                d3.select("#boxplotPlot").classed("selecting",false);                
                d3.selectAll(".scatterplotPoints").classed("selected",false);
                d3.selectAll(".boxplotPoints").classed("selected",false);
                
            }
            
            d3.select('#scatterplotBrush').call(scatterplotBrush.clear());
            d3.select('#boxplotBrush').call(boxplotBrush.clear());

            // Select specific Background line
            var adm2code = this.id.toString().slice(1);
            
            // Ensure that the equivalent value is the same as the default specified in the css or elsewhere
            if(!(d3.select('#b'+adm2code).attr('class')=="boxplotPoints selected") ||
                !(d3.select('#s'+adm2code).attr('class')=="scatterplotPoints selected")){
                $(this).css({
                    'fill':"rgba(124,240,10,0.0)"
                });
                $('#p'+adm2code).css({
                    'fill':"rgba(124,240,10,0.0)"
                });                

                d3.select("#scatterplotPlot").classed("selecting",true);
                d3.select("#boxplotPlot").classed("selecting",true);
                d3.select('#s'+adm2code).classed("selected",true);
                d3.select('#b'+adm2code).classed("selected",true);
                
                provSelectCount++;
                
            }else{
                $(this).css({
                    'fill':''
                });
                $('#p'+adm2code).css({
                    'fill':''
                });

                d3.select("#scatterplotPlot").classed("selecting",true);
                d3.select("#boxplotPlot").classed("selecting",true);
                d3.select('#s'+adm2code).classed("selected",false);
                d3.select('#b'+adm2code).classed("selected",false);
                //d3.select('#l'+adm2code).style("stroke","").style("stroke-width","");
                
                provSelectCount--;
                
                if(provSelectCount==0){
                    $('#counties path').css({
                        'fill':"rgba(124,240,10,0.0)"
                    });
                    
                    $('#counties_mi path').css({
                        'fill':"rgba(124,240,10,0.0)"
                    });                             

                    // Hide foreground - using a mixture of jQuery & d3 selectors. No diff between them.
                    d3.select("#scatterplotPlot").classed("selecting",false);
                    d3.select("#boxplotPlot").classed("selecting",false);
                }                
            }
        });        
        
    }

});
