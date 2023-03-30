class LineChart {

    constructor(_config, _data, _xAxisName, _yAxisName, _title) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 600,
        containerHeight: _config.containerHeight || 300,
        margin: { top: 50, bottom: 50, right: 50, left: 50 }
      }
  
      this.data = _data;
      this.xAxisName = _xAxisName;
      this.yAxisName = _yAxisName;
      this.title = _title;
      this.initVis();
    }
  
    /**
	 * Initialize scales/axes and append static elements, such as axis titles
	 */
    initVis() {
      let vis = this;
      //let dates, lineData;

      //convert strings to dates
      // this.data.forEach(d => {
      //   dates = new Date(d[0]);
      //   lineData = dates.sort((a, b) => b - a);

      // });
    
      // Calculate inner chart size. Margin specifies the space around the actual chart.
      vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
      vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;
  
      // Initialize scales and axes
	  
	  // Initialize scales
      vis.xScale = d3.scaleLinear()
          .range([0, vis.width])
          .nice();
  
      vis.yScale = d3.scaleLinear()
          .range([vis.height, 0])
          .nice();
  
      // Initialize axes
      vis.xAxis = d3.axisBottom(vis.xScale)
          //.ticks(6)
          //.tickSizeOuter(0)
          //.tickPadding(10)
          //.tickFormat(d => d[1]);
  
      vis.yAxis = d3.axisLeft(vis.yScale);
  
       // Define size of SVG drawing area
       vis.svg = d3.select(vis.config.parentElement)
       .attr('width', vis.config.containerWidth)
       .attr('height', vis.config.containerHeight);
       console.log (vis.data);

      vis.xValue = d => new Date(d[0]);
      vis.yValue = d => d[1];
  
      //vis.area = d3.area()
      //    .x(d => vis.xScale(vis.xValue(d)))
      //    .y1(d => vis.yScale(vis.yValue(d)))
      //    .y0(vis.height);
  
      vis.line = d3.line()
          .x(d => vis.xScale(vis.xValue(d)))
          .y(d => vis.yScale(vis.yValue(d)));
  
      // Set the scale input domains
      vis.xScale.domain(d3.extent(vis.data, vis.xValue));
      vis.yScale.domain(d3.extent(vis.data, vis.yValue));

      // Append both axis titles
      vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('y', vis.height)
            .attr('x', vis.width + 10)
            .attr('dy', '.71em')
            .style('text-anchor', 'end')
            .text(this.xAxisName);
    
      vis.svg.append('text')
            .attr('class', 'axis-title')
            .attr('x', 0)
            .attr('y', 35)
            .attr('dy', '.71em')
            .text(this.yAxisName);
  
      // Append title
      vis.svg.append('text')
          .attr('class', 'axis-title')
          .attr('x', 0)
          .attr('y', 0)
          .attr('dy', '.71em')
          .text(this.title);
    }
  
   updateVis() { 
    let vis = this; 
    vis.svg.selectAll("g").remove()
    vis.chart = vis.svg.append('g')
    .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);
  
        // Append empty x-axis group and move it to the bottom of the chart
        vis.xAxisG = vis.chart.append('g')
        .style('color', 'black')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0,${vis.height})`);
    
    // Append y-axis group
    vis.yAxisG = vis.chart.append('g')
        .style('color', 'black')
        .attr('class', 'axis y-axis');

   // Add line path
   vis.chart.append('path')
       .data([vis.data])
       .attr('class', 'chart-line')
       .attr('d', vis.line)
       .style ("stroke", "#2e4482")
       .style('fill', 'none');
  
       vis.marks = vis.chart.append('g');
       vis.trackingArea = vis.chart.append('rect')
           .attr('width', vis.width)
           .attr('height', vis.height)
           .attr('fill', 'none')
           .attr('pointer-events', 'all');
  
       vis.tooltip = vis.chart.append('g')
       .attr('class', 'tooltip')
       .style('display', 'none');
  
   vis.tooltip.append('circle')
       .attr('r', 4);
  
   vis.tooltip.append('text');
   vis.marks = vis.chart.append('g');
  
      vis.xAxisG.call(vis.xAxis);
      vis.yAxisG.call(vis.yAxis);
      vis.bisectDate = d3.bisector(vis.xValue).left;
     
     this.renderVis();
   }
  
   renderVis() { 
    let vis = this; 
    vis.marks.selectAll('.chart-line')
          .data([vis.data])
        .join('path')
          .attr('class', 'chart-line')
          .attr('d', vis.line)
          .style('fill', 'none');
    vis.trackingArea
          .on('mouseenter', () => {
            vis.tooltip.style('display', 'block');
          })
          .on('mouseleave', () => {
            vis.tooltip.style('display', 'none');
          })
          .on('mousemove', function(event) {
            // Get date that corresponds to current mouse x-coordinate
            const xPos = d3.pointer(event, this)[0]; // First array element is x, second is y
            const date = vis.xScale.invert(xPos);

            //TODO, need to update the tooltip
  
            // Find nearest data point
            const index = vis.bisectDate(vis.data, date, 1);
            console.log(vis.data);
            console.log(date);
            const a = vis.data[index - 1];
            const b = vis.data[index];
            const d = b && (date - a[0] > b[0] - date) ? b : a; 
  
            // Update tooltip
            vis.tooltip.select('circle')
                .style('fill', 'black')
                .attr('transform', `translate(${vis.xScale(new Date(d[0]))},${vis.yScale(d[1])})`);
            
            vis.tooltip.select('text')
                .attr('transform', `translate(${vis.xScale(new Date(d[0]))},${(vis.yScale(d[1]) - 15)})`)
                .style('fill', 'black')
                .text(Math.round(d[1]));
          });
    }
  }