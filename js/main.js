
let weekFilter = [];
let serviceFilter = [];
let zipFilter = [];
let brushFilter = [];
let data, leafletMap;
let zipChart, dayChart, serviceChart;

//d3.tsv('data/test.tsv')
d3.tsv('data/Cincy311_2022_final.tsv')
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
//   console.log(data);
  data = data.filter(function(d){
    return d["LAST_TABLE_UPDATE"].length >= 1 && new Date(d["REQUESTED_DATE"]).getFullYear() >= 2022 && new Date(d["REQUESTED_DATE"]).getMonth() <= 5;
  }); //removes poorly stored data that is missing columns
//   console.log(data);

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
   
    
    //Color by Call Type, Color by Process Time, Color by Call Date, Color by Public Agency

    //Call Type
  let ctList = [...new Set(data.map(d => d["SERVICE_CODE"]))];
  if (ctList.length > 13) {
    ctList = ctList.slice(0,12);
  }
  const  ctColors= d3.scaleOrdinal()
  .domain(ctList)
  .range(d3.quantize(d3.interpolateHcl("#FFC300", "#2A4858"), ctList.length));
  
  //Process Time
  let ptList = [...new Set(data.map(d => d.process))];
  const  ptColors= d3.scaleOrdinal()
  .domain(ptList)
  .range(d3.quantize(d3.interpolateHcl("#06aa06", "#dd0606"), ptList.length));

  //Call Date
  let cdList = [...new Set(data.map(d => d["REQUESTED_DATETIME"]))];
  const  cdColors= d3.scaleOrdinal()
  .domain(cdList)
  .range(d3.quantize(d3.interpolateHcl("#483248", "#39a78e"), cdList.length));

  //Public Agency 
  let paList = [...new Set(data.map(d => d["AGENCY_RESPONSIBLE"]))];
  if (paList.length > 13) {
    paList = paList.slice(0,12);
  }
  const  paColors= d3.scaleOrdinal()
  .domain(paList)
  .range(d3.quantize(d3.interpolateHcl("#0000ff", "#f0000f"), paList.length));


  // Initialize chart and then show it
  leafletMap = new LeafletMap({
    parentElement: '#my-map',
    colorScale: ctColors,
  }, data, "SERVICE_CODE");

  //d3.scaleSequential([0, 100], d3.interpolateViridis
  let l = legend({
    //color: d3.scaleSequential(ctColors.domain(), ctColors.range()),//d3.interpolateHcl("#FFC300", "#2A4858")),//ctColors,
    color: ctColors,
    title: "Legend"
  })


  //leafletMap.changeColors(cdColors, "REQUESTED_DATETIME");
  //leafletMap.changeMap(3, 2);



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

  

    let widthitem = window.innerWidth/3 - 15;
    let heightitem = window.innerHeight/2.5;
      

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
      'colors' : ['#FF5733', ' #900C3F']
      }, getNumberOfThings(data,"ZIPCODE"), "Calls By Zipcode", true,"ZIP Code","Times Called",data); 
    zipChart.updateVis();


    // Timeline  
    timeline = new LineChart({
        'parentElement': '#linechart',
        'containerHeight': heightitem,
        'containerWidth': window.innerWidth - 30,
    }, getNumberOfThingsDate(data, 'REQUESTED_DATETIME'), 'Date', 'Number of calls', 'Timeline', data);
    timeline.updateVis();

    scatterplot = new Scatterplot({ 
        'parentElement': '#scatterplot',
        'containerHeight': heightitem,
        'containerWidth': window.innerWidth - 15,
        'colorScale': ctColors,
        }, getScatter(data), 'Received vs Updated', "Received", "Process time", "code");
    scatterplot.updateVis();



    d3.selectAll(".color").on('click', function() {
      // Toggle 'inactive' class
      //remove inactive from everything
      d3.select("#callT").classed('inactive', false);
      d3.select("#procT").classed('inactive', false);
      d3.select("#callD").classed('inactive', false);
      d3.select("#pubA").classed('inactive', false);
      //except this
      d3.select(this).classed('inactive', !d3.select(this).classed('inactive'));
      d3.select("#legend").selectAll("*").remove();
      d3.select("#legend2").selectAll("*").remove();
      // Filter data accordingly and update vis
      let callT = document.getElementById("callT");
      let procT = document.getElementById("procT");
      let callD = document.getElementById("callD");
      let pubA = document.getElementById("pubA");
      if (callT.classList.contains('inactive')){
        leafletMap.changeColors(ctColors, "SERVICE_CODE");
        scatterplot.changeColors(ctColors, "code");
        l = legend({
          color: ctColors, //d3.scaleSequential(ctColors.domain(), ctColors.range()),//d3.interpolateHcl("#FFC300", "#2A4858")),//ctColors,
          title: "Legend"
        })
      } else if (procT.classList.contains('inactive')){
        leafletMap.changeColors(ptColors, "process");
        scatterplot.changeColors(ptColors, "processtime");
        l = legend({
          color: ptColors, //d3.scaleSequential(ptColors.domain(), ptColors.range()),//d3.interpolateHcl("#FFC300", "#2A4858")),//ctColors,
          title: "Legend"
        })
      } else if (callD.classList.contains('inactive')){
        leafletMap.changeColors(cdColors, "REQUESTED_DATETIME");
        scatterplot.changeColors(cdColors, "request");
        l = legend({
          color: d3.scaleThreshold(["1/1/2022", "2/1/2022", "3/1/2022", "4/1/2022", "5/1/2022","6/1/2022"], d3.quantize(d3.interpolateHcl("#483248", "#39a78e"), 6)),//cdColors, //d3.scaleSequential(cdColors.domain(), cdColors.range()),//d3.interpolateHcl("#FFC300", "#2A4858")),//ctColors,
          title: "Legend"
        })
      } else { //pubA
        leafletMap.changeColors(paColors, "AGENCY_RESPONSIBLE");
        scatterplot.changeColors(paColors, "agency");
        l = legend({
          color: paColors, //d3.scaleSequential(paColors.domain(), paColors.range()),//d3.interpolateHcl("#FFC300", "#2A4858")),//ctColors,
          title: "Legend"
        })
      }
    });
  
  // Extra bar chart focusing on descriptions – showcasing common descriptions

})
//.catch(error => console.error(error));


//filter function for each item we plan on filtering
function filterData(workingData){
  leafletMap.data = workingData;


  //dayChart filtering
  if (weekFilter.length != 0) {
    leafletMap.data = leafletMap.data.filter(d => weekFilter.includes(d.dayOfWeek));
  }
  //serviceChart filtering
  if (serviceFilter.length != 0) {
    leafletMap.data = leafletMap.data.filter(d => serviceFilter.includes(d["SERVICE_CODE"]));
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
  }

  //brushing
//   if (brushFilter.length != 0) {
//     console.log(brushFilter[0]);
//     // Rollup data to get counts of calls per day
//     // leafletMap.data = leafletMap.data.filter(d => {
//     //     return (
//     //         vis.data.timeBounds[0] <= vis.data.parseTime(d.REQUESTED_DATETIME) 
//     //         && vis.data.parseTime(d.REQUESTED_DATETIME) <= vis.data.timeBounds[1]
//     //     )
//     // });
    
//     // leafletMap.data = leafletMap.data.filter(d => (new Date(d["REQUESTED_DATE"]) >= brushFilter[0]));
//     // data = data.filter(function(d){
//     //     return d["LAST_TABLE_UPDATE"].length >= 1 && new Date(d["REQUESTED_DATE"]).getFullYear() >= 2022 && new Date(d["REQUESTED_DATE"]).getMonth() <= 5;
//     //   });
//   }
  
//   console.log(leafletMap.data)

  dayChart.data = getDayOWeek(leafletMap.data);
  serviceChart.data = getNumberOfThings(leafletMap.data,"SERVICE_CODE");
  zipChart.data = getNumberOfThings(leafletMap.data,"ZIPCODE");
  scatterplot.data = getScatter(leafletMap.data)
  timeline.data = getNumberOfThingsDate(leafletMap.data, 'REQUESTED_DATETIME')


  
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

  leafletMap.updateVis();
  dayChart.updateVis();
  serviceChart.updateVis();
  zipChart.updateVis();
  scatterplot.updateVis();
  timeline.updateVis();

}





function getNumberOfThings(data_base, indx) {
  let data1 = d3.rollups(data_base, g => g.length, d => d[indx]);
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


function getScatter(data_base) {

    let colorScale = d3.scaleOrdinal()
        .range(['#0abdc6','#0F7EA1','#133e7c'])
        .domain([0, d3.max(data_base, data_base.process)]);

    let data = [];

    data_base.forEach(d => {
      data.push({"name": d['SERVICE_NAME'],'label':'', 'request':d.request, 'processtime':d.process, 'color':colorScale(d.Distance), 'code':d['SERVICE_CODE'], 'agency':d['AGENCY_RESPONSIBLE']})
    })

    return(data);
}

function getNumberOfThingsDate(data_base, indx) {
  let data1 = d3.rollups(data_base, g => g.length, d => d[indx]);
  data1.forEach(d => {
    d[0] = new Date(d[0]);
  });

  data1 = data1.sort((a,b) => {
      return a[0] - b[0];
    });


  return(data1)
}


function legend({
  color,
  title,
  tickSize = 6,
  width = window.innerWidth - 50,
  height = 44 + tickSize,
  marginTop = 18,
  marginRight = 0,
  marginBottom = 16 + tickSize,
  marginLeft = 0,
  ticks = width / 64,
  tickFormat,
  tickValues
} = {}) {
  const svg = d3.select("#legend")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("display", "block");

  const svg2 = d3.select("#legend2")
    .attr("width", width)
    .attr("height", height)
    .attr("viewBox", [0, 0, width, height])
    .style("overflow", "visible")
    .style("display", "block");

  let tickAdjust = g => g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
  let x;

  // Continuous
  if (color.interpolate) {
    const n = Math.min(color.domain().length, color.range().length);

    x = color.copy().rangeRound(d3.quantize(d3.interpolate(marginLeft, width - marginRight), n));

    svg.append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
    
    svg2.append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp(color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))).toDataURL());
  }

  // Sequential
  else if (color.interpolator) {
    x = Object.assign(color.copy()
      .interpolator(d3.interpolateRound(marginLeft, width - marginRight)), {
        range() {
          return [marginLeft, width - marginRight];
        }
      });

    svg.append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp(color.interpolator()).toDataURL());

    svg2.append("image")
      .attr("x", marginLeft)
      .attr("y", marginTop)
      .attr("width", width - marginLeft - marginRight)
      .attr("height", height - marginTop - marginBottom)
      .attr("preserveAspectRatio", "none")
      .attr("xlink:href", ramp(color.interpolator()).toDataURL());

    // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
    if (!x.ticks) {
      if (tickValues === undefined) {
        const n = Math.round(ticks + 1);
        tickValues = d3.range(n).map(i => d3.quantile(color.domain(), i / (n - 1)));
      }
      if (typeof tickFormat !== "function") {
        tickFormat = d3.format(tickFormat === undefined ? ",f" : tickFormat);
      }
    }
  }

  // Threshold
  else if (color.invertExtent) {
    const thresholds = color.thresholds ? color.thresholds() // scaleQuantize
      :
      color.quantiles ? color.quantiles() // scaleQuantile
      :
      color.domain(); // scaleThreshold

    const thresholdFormat = tickFormat === undefined ? d => d :
      typeof tickFormat === "string" ? d3.format(tickFormat) :
      tickFormat;

    x = d3.scaleLinear()
      .domain([-1, color.range().length - 1])
      .rangeRound([marginLeft, width - marginRight]);

    svg.append("g")
      .selectAll("rect")
      .data(color.range())
      .join("rect")
      .attr("x", (d, i) => x(i - 1))
      .attr("y", marginTop)
      .attr("width", (d, i) => x(i) - x(i - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", d => d);
    
    svg2.append("g")
      .selectAll("rect")
      .data(color.range())
      .join("rect")
      .attr("x", (d, i) => x(i - 1))
      .attr("y", marginTop)
      .attr("width", (d, i) => x(i) - x(i - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", d => d);

    tickValues = d3.range(thresholds.length);
    tickFormat = i => thresholdFormat(thresholds[i], i);
  }

  // Ordinal
  else {
    x = d3.scaleBand()
      .domain(color.domain())
      .rangeRound([marginLeft, width - marginRight]);

    svg.append("g")
      .selectAll("rect")
      .data(color.domain())
      .join("rect")
      .attr("x", x)
      .attr("y", marginTop)
      .attr("width", Math.max(0, x.bandwidth() - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", color);

    svg2.append("g")
      .selectAll("rect")
      .data(color.domain())
      .join("rect")
      .attr("x", x)
      .attr("y", marginTop)
      .attr("width", Math.max(0, x.bandwidth() - 1))
      .attr("height", height - marginTop - marginBottom)
      .attr("fill", color);

    tickAdjust = () => {};
  }

  svg.append("g")
    .attr("transform", `translate(0,${height - marginBottom})`)
    .call(d3.axisBottom(x)
      .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
      .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
      .tickSize(tickSize)
      .tickValues(tickValues))
      .attr("font-size", "8px")
    .call(tickAdjust)
    .call(g => g.select(".domain").remove())
    .call(g => g.append("text")
      .attr("x", marginLeft)
      .attr("y", marginTop + marginBottom - height - 6)
      .attr("fill", "currentColor")
      .attr("text-anchor", "start")
      .attr("font-weight", "bold")
      .text(title));
    
  svg2.append("g")
      .attr("transform", `translate(0,${height - marginBottom})`)
      .call(d3.axisBottom(x)
        .ticks(ticks, typeof tickFormat === "string" ? tickFormat : undefined)
        .tickFormat(typeof tickFormat === "function" ? tickFormat : undefined)
        .tickSize(tickSize)
        .tickValues(tickValues))
        .attr("font-size", "8px")
      .call(tickAdjust)
      .call(g => g.select(".domain").remove())
      .call(g => g.append("text")
        .attr("x", marginLeft)
        .attr("y", marginTop + marginBottom - height - 6)
        .attr("fill", "currentColor")
        .attr("text-anchor", "start")
        .attr("font-weight", "bold")
        .text(title));
  

  return svg2.node();
  return svg.node();
}

function ramp(color, n = 256) {
  var canvas = document.createElement('canvas');
  canvas.width = n;
  canvas.height = 1;
  const context = canvas.getContext("2d");
  for (let i = 0; i < n; ++i) {
    context.fillStyle = color(i / (n - 1));
    context.fillRect(i, 0, 1, 1);
  }
  return canvas;
}