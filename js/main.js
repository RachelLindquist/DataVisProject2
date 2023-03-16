d3.tsv('data/Cincy311_2022_final.tsv')
.then(data => {
    d3.select("#callT").classed('inactive', true);
    d3.select("#st").classed('inactive', true);

    //Note- some entries may not have GPS coordinates.  
    //Don't eliminate these items altogether, 
    //because they are part of the dataset and should be featured in the other charts.
    //You could indicate somewhere within the visualization how many calls are not mapped. 
    //^ handled by count
    let count = data.length;
    var data = data.filter(function(d){
      return d["LAST_TABLE_UPDATE"].length >= 1;
    }); //removes poorly stored data that is missing columns
    count = count - data.length; //stores number of missing data, still need to display somewhere
    document.getElementById("count").innerHTML = " Missing Data: " + count; //can change display if we want


    data.forEach(d => {
      d.latitude = +d["LATITUDE"]; //make sure these are not strings
      d.longitude = +d["LONGITUDE"]; //make sure these are not strings
      //Add in process_time calculation instead of just 0
      d.process = +0;

      //0 is sunday, 1 is monday...
      let dt = (new Date(d["REQUESTED_DATE"])).getDay();
      d.dayOfWeek = dt;
    });

    //Color by Call Type, Color by Process Time, Color by Call Date, Color by Public Agency

    //Call Type
    let ctList = [...new Set(data.map(d => d["SERVICE_CODE"]))];
    const  ctColors= d3.scaleOrdinal()
    .domain(ctList)
    .range(d3.quantize(d3.interpolateHcl("#fafa6e", "#2A4858"), ctList.length));
    
    //Process Time
    let ptList = [...new Set(data.map(d => d.process))];
    const  ptColors= d3.scaleOrdinal()
    .domain(ptList)
    .range(d3.quantize(d3.interpolateHcl("#ff0000", "#00ff00"), ptList.length));

    //Call Date
    let cdList = [...new Set(data.map(d => d["REQUESTED_DATETIME"]))];
    const  cdColors= d3.scaleOrdinal()
    .domain(cdList)
    .range(d3.quantize(d3.interpolateHcl("#000000", "#ffffff"), cdList.length));

    //Public Agency 
    let paList = [...new Set(data.map(d => d["AGENCY_RESPONSIBLE"]))];
    const  paColors= d3.scaleOrdinal()
    .domain(paList)
    .range(d3.quantize(d3.interpolateHcl("#0000ff", "#f0000f"), paList.length));
  

    // Initialize chart and then show it
    leafletMap = new LeafletMap({
      parentElement: '#my-map',
      colorScale: ctColors,
    }, data, "SERVICE_CODE");

    //leafletMap.changeColors(cdColors, "REQUESTED_DATETIME");
    //leafletMap.changeMap(3, 2);


    d3.selectAll(".color").on('click', function() {
      // Toggle 'inactive' class
      //remove inactive from everything
      d3.select("#callT").classed('inactive', false);
      d3.select("#procT").classed('inactive', false);
      d3.select("#callD").classed('inactive', false);
      d3.select("#pubA").classed('inactive', false);
      //except this
      d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));
      
      // Filter data accordingly and update vis
      let callT = document.getElementById("callT");
      let procT = document.getElementById("procT");
      let callD = document.getElementById("callD");
      let pubA = document.getElementById("pubA");
      if (callT.classList.contains('inactive')){
        leafletMap.changeColors(ctColors, "SERVICE_CODE");
      } else if (procT.classList.contains('inactive')){
        leafletMap.changeColors(ptColors, "process");
      } else if (callD.classList.contains('inactive')){
        leafletMap.changeColors(cdColors, "REQUESTED_DATETIME");
      } else { //pubA
        leafletMap.changeColors(paColors, "AGENCY_RESPONSIBLE");
      }
    });

    d3.selectAll(".map").on('click', function() {
      // Toggle 'inactive' class
      //get prev to remove later
      let prev = 0;
      if (d3.select("#esri").classed('inactive')){
        prev = 1;
      } else if (d3.select("#topo").classed('inactive')){
        prev = 2;
      } else {
        prev = 3;
      }
      //remove inactive from everything
      d3.select("#esri").classed('inactive', false);
      d3.select("#topo").classed('inactive', false);
      d3.select("#st").classed('inactive', false);
      //except this
      d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));
      
      // Filter data accordingly and update vis
      let esri = document.getElementById("esri");
      let topo = document.getElementById("topo");
      let st = document.getElementById("st");
      if (esri.classList.contains('inactive')){
        leafletMap.changeMap(prev, 1);
      } else if (topo.classList.contains('inactive')){
        leafletMap.changeMap(prev, 2);
      } else{ //st
        leafletMap.changeMap(prev, 3);
      } 
    });

    // Bar chart #1:
    
    const colorScale1 = d3.scaleOrdinal()
        .domain(['0', '1', '2', '3', '4', '5', '6'])
        .range(['#6497b1', '#6497b1', '#6497b1', '#6497b1', '#6497b1', '#6497b1', '#6497b1']);

        let barChart1 = new BarChart({
        'parentElement': '#barChart1',
        'colorScale' : colorScale1,
        'containerHeight': 200,
        'containerWidth': 400,
        }, data, d.dayOfWeek, "Days of the week", false); 
        barChart1.updateVis();



  })
  //.catch(error => console.error(error));
