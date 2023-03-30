
let weekFilter = [];
let serviceFilter = [];
let zipFilter = [];
let data, leafletMap;
let zipChart, dayChart, serviceChart;

d3.tsv('data/test.tsv')
//d3.tsv('data/Cincy311_2022_final.tsv')
.then(_data => {
  data = _data;
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
    let requestDate = new Date(d['REQUESTED_DATETIME']); // force proper dates instead of weird string vals
    let updateDate = new Date(d ['UPDATED_DATETIME']); // force proper dates instead of weird string vals
    let dif = updateDate.getTime() - requestDate.getTime();

    d.process = dif/ (1000 * 3600 * 24);
    d.request = new Date (requestDate.toLocaleString().split(',')[0]);

    //0 is sunday, 1 is monday...
    let dt = (new Date(d["REQUESTED_DATE"])).getDay();
    d.dayOfWeek = dt;


    });
    // console.log(data[0].dayOfWeek);
    
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

  // Timeline  
  let timeline = new LineChart({
		'parentElement': '#linechart',
		'containerHeight': 300,
		'containerWidth': 400,
	}, getNumberOfThings(data, 'REQUESTED_DATETIME'), 'Date', 'Number of calls', 'Timeline');
	timeline.updateVis();

  // Bar chart #1:

  

  


    let widthitem = window.innerWidth/3 - 15;
    let heightitem = window.innerHeight/3;
      

      // Day of the week visualization- bar chart
      dayChart = new Barchart({
          'parentElement': '#daybar',
          'containerHeight': heightitem,
          'containerWidth': widthitem,
          // 'reverseOrder': true,
          // 'yScaleLog': false
          'colors' : ['#00ff00', '#ff0000']
          }, getDayOWeek(data), "Days of the Week", true,"Day","Amount",data); 
      dayChart.updateVis();

          
  // Major categories (service code) visualization – bar chart
    serviceChart = new Barchart({
        'parentElement': '#servicebar',
        'containerHeight': heightitem,
        'containerWidth': widthitem,
        'reverseOrder': true,
        // 'yScaleLog': false
        'colors' : ['#00ff00', '#0000ff']
        }, getNumberOfThings(data,"SERVICE_CODE"), "Major Categories", true,"Service Code","Times Called",data); 
    serviceChart.updateVis();
      
    // Visualization showing number of calls by zip code- bar chart
    zipChart = new Barchart({
      'parentElement': '#zipbar',
      'containerHeight': heightitem,
      'containerWidth': widthitem,
      'reverseOrder': true,
      // 'yScaleLog': false
      'colors' : ['#000000', '#aaaaaa']
      }, getNumberOfThings(data,"ZIPCODE"), "Calls By Zipcode", true,"Zip Code","Times Called",data); 
    zipChart.updateVis();


    scatterplot = new Scatterplot({ 
        'parentElement': '#scatterplot',
        'containerHeight': heightitem,
        'containerWidth': widthitem*2,
        }, getMassRad(data), 'Recived vs Updated', "Recived", "Process time");
    scatterplot.updateVis();
  
  // Extra bar chart focusing on descriptions – showcasing common descriptions

})
//.catch(error => console.error(error));


//filter function for each item we plan on filtering
function filterData(workingData){
  leafletMap.data = workingData;
  dayChart.data = getDayOWeek(workingData);
  serviceChart.data = getNumberOfThings(workingData,"SERVICE_CODE");
  zipChart.data =getNumberOfThings(workingData,"ZIPCODE");
  //dayChart filtering
  if (weekFilter.length != 0) {
    leafletMap.data = leafletMap.data.filter(d => weekFilter.includes(d.dayOfWeek));
    serviceChart.data = getNumberOfThings(serviceChart.ALLDATA.filter(d => weekFilter.includes(d.dayOfWeek)),"SERVICE_CODE");
    zipChart.data = getNumberOfThings(zipChart.ALLDATA.filter(d => weekFilter.includes(d.dayOfWeek)),"ZIPCODE");
  }

  //serviceChart filtering
  if (serviceFilter.length != 0) {
    leafletMap.data = leafletMap.data.filter(d => serviceFilter.includes(d["SERVICE_CODE"]));
    dayChart.data = getDayOWeek(dayChart.ALLDATA.filter(d => serviceFilter.includes(d["SERVICE_CODE"])));
    zipChart.data = getNumberOfThings(zipChart.ALLDATA.filter(d => serviceFilter.includes(d["SERVICE_CODE"])), "ZIPCODE");
  }
  /*
  if (processFilter.length == 0) {
    leafletMap.data = data;
  } else {
    leafletMap.data = data.filter(d => processFilter.includes(d.process));
  } */
  //zipChart
  if (zipFilter.length != 0) {
    leafletMap.data = leafletMap.data.filter(d => zipFilter.includes(d["ZIPCODE"]));
    dayChart.data = getDayOWeek(dayChart.ALLDATA.filter(d => zipFilter.includes(d["ZIPCODE"])));
    serviceChart.data = getNumberOfThings(serviceChart.ALLDATA.filter(d => zipFilter.includes(d["ZIPCODE"])),"SERVICE_CODE");
  }


  leafletMap.updateVis();
  //if used for filtering, make it unfiltered
  if (weekFilter.length != 0){
    dayChart.data = getDayOWeek(workingData);
  }
  if (serviceFilter.length != 0){
    serviceChart.data = getNumberOfThings(workingData,"SERVICE_CODE");
  }
  if (zipFilter.length != 0){
    zipChart.data =getNumberOfThings(workingData,"ZIPCODE");
  }
  dayChart.updateVis();
  serviceChart.updateVis();
  zipChart.updateVis();
}





function getNumberOfThings(data_base, indx) {
  console.log(data);
  let data1 = d3.rollups(data_base, g => g.length, d => d[indx]);
  //   console.log(vis.data)
  data1 = data1.sort((a,b) => {
      return a[1] - b[1];
    });

  return(data1)
}

function getDayOWeek(data_base) {
  let totalp = {'Sunday':0, 'Monday':0, 'Tusday':0, 'Wednesday':0, 'Thursday':0, 'Friday':0, 'Saturday':0};
  let weekday = ["Sunday", "Monday", "Tusday", "Wednesday", "Thursday", "Friday", "Saturday"];

  data_base.forEach(d => {
      totalp[weekday[d.dayOfWeek]] += 1;
  })
  
  let data1 = dicToArr(totalp);
  return(data1);
}

function dicToArr(totalp) {
  // this is lazy coding but i needed to do it quickly so
  let data1 = [];
  for (let tp in totalp){
      data1.push([tp,totalp[tp]]);
  }
  return(data1);
}


function getMassRad(data_base) {

    let colorScale = d3.scaleOrdinal()
        .range(['#0abdc6','#0F7EA1','#133e7c'])
        .domain([0, d3.max(data_base, data_base.process)]);

    let data = [];

    data_base.forEach(d => {
        if (d.StellarRadius != 0 && d.StellarMass != 0) {
            data.push({"name": d['SERVICE_NAME'],'label':'', 'request':d.request, 'processtime':d.process, 'color':colorScale(d.Distance), 'code':d['SERVICE_CODE']})
        }
    })

    return(data);
}