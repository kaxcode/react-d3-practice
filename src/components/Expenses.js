import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import chroma from 'chroma-js';

const height = 600;
const margin = {
  left: 20,
  top: 60,
  right: 20,
  bottom: 20,
};
const radius = 7;

// d3 functions
const xScale = d3.scaleBand().domain([0, 1, 2, 3, 4, 5, 6]);
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
const colorScale = chroma.scale(['#53cf8d', '#f7d283', '#e85151']);
const amountScale = d3.scaleLog();
const simulation = d3
  .forceSimulation()
  .force('collide', d3.forceCollide(radius))
  .force('x', d3.forceX(d => d.focusX))
  .force('y', d3.forceY(d => d.focusY))
  .stop();

class Expenses extends React.Component {
  constructor(props) {
    super(props);

    this.container = React.createRef();
  }

  componentWillMount() {
    xScale.range([margin.left, this.props.width - margin.right]);
    simulation
      .force('center', d3.forceCenter(this.props.width / 2, height / 2))
      .on('tick', this.forceTick);
  }

  componentDidMount() {
    this.container = d3.select(this.container.current);
    this.calculateData();
    this.renderCircles();

    simulation
      .nodes(this.props.expenses)
      .alpha(0.9)
      .restart();
  }

  calculateData() {
    const weeksExtent = d3.extent(this.props.expenses, d => d3.timeWeek.floor(d.date));
    yScale.domain(weeksExtent);
    this.expenses = _.chain(this.props.expenses)
      .groupBy(d => d3.timeWeek.floor(d.date))
      .map((expenses, week) => {
        week = new Date(week);
        return _.map(expenses, exp => {
          return Object.assign(exp, {
            focusX: xScale(exp.date.getDay()),
            focusY: yScale(week),
          });
        });
      })
      .flatten()
      .value();

    const amountExtent = d3.extent(this.expenses, d => d.amount);
    amountScale.domain(amountExtent);
  }

  forceTick = () => {
    this.circles.attr('cx', d => d.x).attr('cy', d => d.y);
  };

  renderCircles() {
    // draw expenses circles
    this.circles = this.container.selectAll('circle').data(this.expenses, d => d.name);

    // exit
    this.circles.exit().remove();

    // enter+update
    this.circles = this.circles
      .enter()
      .append('circle')
      .attr('r', radius)
      .attr('fill-opacity', 0.25)
      .attr('stroke-width', 3)
      .merge(this.circles)
      .attr('fill', d => colorScale(amountScale(d.amount)))
      .attr('stroke', d => colorScale(amountScale(d.amount)));
  }

  render() {
    return <svg width={this.props.width} height={height} ref={this.container} />;
  }
}

export default Expenses;
