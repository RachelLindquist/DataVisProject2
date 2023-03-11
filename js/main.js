


d3.tsv('data/Cincy311_2022_final.tsv')
.then(data => {
    console.log(data[0]);
    console.log(data.length);
    d3.select("#callT").classed('inactive', true);

    var data = data.filter(function(d){
      return d["LAST_TABLE_UPDATE"].length >= 1;
    }); //removes poorly stored data that is missing columns
    console.log(data.length);
    data.forEach(d => {
      d.latitude = +d["LATITUDE"]; //make sure these are not strings
      d.longitude = +d["LONGITUDE"]; //make sure these are not strings
      //Add in process_time calculation instead of just 0
      d.process = +0;
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


  })
  //.catch(error => console.error(error));
