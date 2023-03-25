class Barchart {

    /**
     * Class constructor with basic chart configuration
     * @param {Object}
     * @param {Array}
     */
    constructor(_config, _data, _title,_discover, _xlabel, _ylabel, _ALLDATA) {
      // Configuration object with defaults
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 710,
        containerHeight: _config.containerHeight || 200,
        margin: _config.margin || {top: 25, right: 60, bottom: 60, left: 70},
        reverseOrder: _config.reverseOrder || false,
        tooltipPadding: _config.tooltipPadding || 15,
        yScaleLog:_config.yScaleLog || false,
        colors: _config.colors || NaN,
      }
      this.data = _data;
      this.title = _title;
      this.discover = _discover;
      this.xlabel = _xlabel;
      this.ylabel = _ylabel;
      this.ALLDATA = _ALLDATA;
    //   this.id = _id
      this.initVis();
    }
    
    /**
     * Initialize scales/axes and append static elements, such as axis titles
     */
    initVis() {
      let vis = this;
      
  
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

    //   console.log(this.config.colors)
    //   if (!isNaN(this.config.colors)) {
    vis.colors = d3.scaleOrdinal()
        .range (this.config.colors.range())
        .domain(this.config.colors.domain())
    //   }
  
      // Initialize scales and axes
      // Important: we flip array elements in the y output range to position the rectangles correctly
      
      vis.yScale = d3.scaleLinear()
          .range([vis.height, 0]) 
  
      vis.xScale = d3.scaleBand()
          .range([0, vis.width])
          .paddingInner(0.2);
  
      vis.xAxis = d3.axisBottom(vis.xScale)
     
        // .selectAll("text")
        //         .attr("transform", "translate(-10,0)rotate(-45)")
        //         .style("text-anchor", "end");
        //   .tickSizeOuter(0);
  
      vis.yAxis = d3.axisLeft(vis.yScale)
          .ticks(8)
        //   .tickSizeOuter(0)
        //   .tickFormat(d3.formatPrefix('.0s', 1e6)); // Format y-axis ticks as millions
  
      // Define size of SVG drawing area
      vis.svg = d3.select(vis.config.parentElement)
          .attr('width', vis.config.containerWidth)
          .attr('height', vis.config.containerHeight);
          
  
      // SVG Group containing the actual chart; D3 margin convention
      vis.chart = vis.svg.append('g')
          .attr('transform', `translate(${vis.config.margin.left},${vis.config.margin.top})`);
  
      // Append empty x-axis group and move it to the bottom of the chart
      vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`);
          
          
      
      // Append y-axis group 
      vis.yAxisG = vis.chart.append('g')
          .attr('class', 'axis y-axis');

    }
  
    /**
     * Prepare data and scales before we render it
     */
    updateVis() {
      let vis = this;

    //   vis.data = d3.rollups(vis.data, g => g.length, d => d[vis.id]);
    // //   console.log(vis.data)

    //   vis.data = vis.data.sort((a,b) => {
    //     return a[0] - b[0];
    //   });
  
      // Reverse column order depending on user selection
      if (vis.config.reverseOrder) {
        vis.data.reverse();
      }
  
      // Specificy x- and y-accessor functions
      console.log(vis.data);
      vis.xValue = d => d[0];
      vis.yValue = d => d[1];
      vis.colorValue = d => vis.colors(d[0]);
  
    //   let updateY = 0
    //   if (vis.config.yUpdate){
    //     updateY = d3.min(vis.data, vis.yValue)
    //   }

      // Set the scale input domains
      vis.xScale.domain(vis.data.map(vis.xValue));
      vis.yScale.domain([0, d3.max(vis.data, vis.yValue)]);

      if (vis.discover) {
        // console.log(vis.discover)
        vis.xAxisG
            // .transition().duration(1000)
            .call(vis.xAxis)
            .selectAll('text')
                .style("text-anchor", "start")
                .style("font-size", "10px")
                .attr('transform',"rotate(25)");
                
      }

      vis.renderVis();
    }
  
    /**
     * Bind data to visual elements
     */
    renderVis() {
      let vis = this;
    //   console.log(vis.yScale(d3.min(vis.data, vis.yValue)))
  
      // Add rectangles
      let bars = vis.chart.selectAll('.bar')
          .data(vis.data, vis.xValue)
        .join('rect');
      
      bars.style('opacity', 0.5)
        .transition().duration(1000)
          .style('opacity', 1)
          .attr('class', 'bar')
          .attr('x', d => vis.xScale(vis.xValue(d)))
          .attr('width', vis.xScale.bandwidth())
          .attr('height', d => vis.height - vis.yScale(vis.yValue(d)))
          .attr('y', d => vis.yScale(vis.yValue(d)))
          .attr('fill', d => vis.colors(vis.colorValue(d)));
      
      // Tooltip event listeners
      bars
          .on('mouseover', (event,d) => {
            d3.select('#tooltip')
              .style('opacity', 1)
              // Format number with million and thousand separator
              .html(`<div class="tooltip-label">${d[0]}</div>${d3.format(',')(d[1])}`);
          })
          .on('mousemove', (event) => {
            d3.select('#tooltip')
              .style('left', (event.pageX + vis.config.tooltipPadding) + 'px')   
              .style('top', (event.pageY + vis.config.tooltipPadding) + 'px')
          })
          .on('mouseleave', () => {
            d3.select('#tooltip').style('opacity', 0);
          });

        /*
        bars.on('click', function(event, d) {
            const isActive = typeFilter.includes(vis.title);
            console.log(valFilter);
            if (isActive) {
              valFilter = valFilter.filter(f => f !== d[0]); // Remove filter
              typeFilter = typeFilter.filter(f => f !== vis.title); // Remove filter
            } else {
                // valFilter = [d[0]];
                // typeFilter = [vis.title];
              valFilter.push(d[0]); // Append filter
              typeFilter.push(vis.title);
            }
            filterData(vis.ALLDATA,vis.title); // Call global function to update scatter plot
            d3.select(this).classed('active', !isActive); // Add class to style active filters with CSS
          }); */
          bars.on('click', function(event, d) {
            //let fil = d.title + "," + d.key;
            //const isActive = filter.includes(fil);
            /* 
            let weekFilter = [];
            let serviceFilter = [];
            let zipFilter = [];
            */
            let weekday = ["Sunday", "Monday", "Tusday", "Wednesday", "Thursday", "Friday", "Saturday"];
            if (vis.title == "Days of the Week"){
                //already has wednesday
                const isActive = weekFilter.includes(weekday.indexOf(d[0]));
                if (isActive) {
                    //weekday.findIndex(d[0])
                    weekFilter = weekFilter.filter(f => f !== weekday.indexOf(d[0])); // Remove from filter
                    d3.select(event.currentTarget).style("stroke", "none");
                    //^CSS, change as we see fit
                } else {
                    weekFilter.push(weekday.indexOf(d[0])); // Add to filter
                    d3.select(event.currentTarget).style("stroke", "#ffffff");
                    //^CSS, change as we see fit
                }
            } else if (vis.title == "Major Categories"){
                const isActive = serviceFilter.includes(d[0]);
                if (isActive) {
                    //weekday.findIndex(d[0])
                    serviceFilter = serviceFilter.filter(f => f != d[0]); // Remove from filter
                    d3.select(event.currentTarget).style("stroke", "none");
                    //^CSS, change as we see fit
                } else {
                    serviceFilter.push(d[0]); // Add to filter
                    d3.select(event.currentTarget).style("stroke", "#ffffff");
                    //^CSS, change as we see fit
                }
            } else if (vis.title == "Calls By Zipcode"){
                const isActive = zipFilter.includes(d[0]);
                if (isActive) {
                    //weekday.findIndex(d[0])
                    zipFilter = zipFilter.filter(f => f != d[0]); // Remove from filter
                    d3.select(event.currentTarget).style("stroke", "none");
                    //^CSS, change as we see fit
                } else {
                    zipFilter.push(d[0]); // Add to filter
                    d3.select(event.currentTarget).style("stroke", "#ffffff");
                    //^CSS, change as we see fit
                }
            }
            filterData(vis.ALLDATA);
            
          });

    
  
    //   // Update axes
    //   vis.xAxisG
    //       .transition().duration(1000)
    //       .call(vis.xAxis);
  
    vis.xAxisG.call(vis.xAxis);
        vis.chart.append('text')
        .attr('class', 'axis-title')
        .attr("y", vis.height + vis.config.margin.bottom-10)
        .attr("x",(vis.width / 2))
        .style("text-anchor", "middle")
        .text(vis.xlabel);
    
    vis.yAxisG.call(vis.yAxis);
        vis.chart.append('text')
        .attr('class', 'axis-title')
        .attr("transform", "rotate(-90)")
        .attr("y", 0 - vis.config.margin.left)
        .attr("x",0 - (vis.height / 2))
        .attr("dy", "1em")
        .style("text-anchor", "middle")
        .text(vis.ylabel);

    
    }
  }
  
  