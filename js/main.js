


d3.tsv('data/Cincy311_2022_final.tsv')
.then(data => {
    console.log(data[0]);
    console.log(data.length);
    data.forEach(d => {
      //console.log(d);
      d.latitude = 0;
      d.longitude = 0;
      if (d["LONGITUDE"].split('.').length - 1 === 1){
        d.latitude = +d["LATITUDE"]; //make sure these are not strings
        d.longitude = +d["LONGITUDE"]; //make sure these are not strings
      }
    });

    // Initialize chart and then show it
    leafletMap = new LeafletMap({parentElement: '#my-map'}, data);


  })
  //.catch(error => console.error(error));
