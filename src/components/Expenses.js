import React from 'react';
import _ from 'lodash';
import * as d3 from 'd3';
import chroma from 'chroma-js';

const height = 600;
const margin = {
  left: 40,
  top: 20,
  right: 40,
  bottom: 20
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
    this.state = {};
    this.container = React.createRef();
  }

  componentWillMount() {
    xScale.range([margin.left, this.props.width - margin.right]);
    simulation.on('tick', this.forceTick);
  }

  componentDidMount() {
    this.container = d3.select(this.container.current);
    this.calculateData();
    this.renderWeeks();
    this.renderDays();

    simulation
      .nodes(this.props.expenses)
      .alpha(0.9)
      .restart();
  }

  componentDidUpdate() {
    this.calculateData();
  }

  calculateData() {
    const weeksExtent = d3.extent(this.props.expenses, d =>
      d3.timeWeek.floor(d.date)
    );
    yScale.domain(weeksExtent);

    // rectangle for each week
    var weeks = d3.timeWeek.range(
      weeksExtent[0],
      d3.timeWeek.offset(weeksExtent[1], 1)
    );
    this.weeks = _.map(weeks, week => {
      return {
        week,
        x: margin.left,
        y: yScale(week) + height
      };
    });

    this.expenses = _.chain(this.props.expenses)
      .groupBy(d => d3.timeWeek.floor(d.date))
      .map((expenses, week) => {
        week = new Date(week);
        return _.map(expenses, exp => {
          return Object.assign(exp, {
            focusX: xScale(exp.date.getDay()),
            focusY: yScale(week)
          });
        });
      })
      .flatten()
      .value();

    const amountExtent = d3.extent(this.expenses, d => d.amount);
    amountScale.domain(amountExtent);
  }

  renderDays() {
    // draw expenses circles
    this.circles = this.container
      .selectAll('.expense')
      .data(this.expenses, d => d.name);

    // exit
    this.circles.exit().remove();

    // enter+update
    this.circles = this.circles
      .enter()
      .append('circle')
      .classed('expense', true)
      .attr('r', radius)
      .attr('fill-opacity', 0.25)
      .attr('stroke-width', 3)
      .merge(this.circles)
      .attr('fill', d => colorScale(amountScale(d.amount)))
      .attr('stroke', d => colorScale(amountScale(d.amount)));
  }

  renderWeeks() {
    var weeks = this.container
      .selectAll('.week')
      .data(this.weeks, d => d.name)
      .enter()
      .append('g')
      .classed('week', true)
      .attr('transform', d => 'translate(' + [d.x, d.y] + ')');

    var rectHeight = 10;
    weeks
      .append('rect')
      .attr('y', -rectHeight / 2)
      .attr('width', this.props.width - margin.left - margin.right)
      .attr('height', rectHeight)
      .attr('fill', '#ccc')
      .attr('opacity', 0.25);

    var weekFormat = d3.timeFormat('%m/%d');
    weeks
      .append('text')
      .attr('text-anchor', 'end')
      .attr('dy', '.35em')
      .text(d => weekFormat(d.week));
  }

  forceTick = () => {
    this.circles.attr('cx', d => d.x).attr('cy', d => d.y);
  };

  render() {
    return (
      <svg width={this.props.width} height={2 * height} ref={this.container} />
    );
  }
}

export default Expenses;
