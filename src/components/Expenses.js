import React, { Component } from 'react';
import * as d3 from 'd3';
import _ from 'lodash';

import chroma from 'chroma-js';

const height = 600;
const margin = {
  left: 40,
  top: 20,
  right: 40,
  bottom: 20,
};
const radius = 7;

// d3 functions
const daysOfWeek = [[0, 'S'], [1, 'M'], [2, 'T'], [3, 'W'], [4, 'Th'], [5, 'F'], [6, 'S']];
const xScale = d3.scaleBand().domain(_.map(daysOfWeek, 0));
const yScale = d3.scaleLinear().range([height - margin.bottom, margin.top]);
const colorScale = chroma.scale(['#53cf8d', '#f7d283', '#e85151']);
const amountScale = d3.scaleLog();
const simulation = d3
  .forceSimulation()
  .alphaDecay(0.001)
  .velocityDecay(0.3)
  // .force('charge', d3.forceManyBody(-10))
  .force('collide', d3.forceCollide(radius))
  .force('x', d3.forceX(d => d.focusX))
  .force('y', d3.forceY(d => d.focusY))
  .stop();

class Expenses extends Component {
  constructor(props) {
    super(props);

    this.state = {};
    this.container = React.createRef();
    this.forceTick = this.forceTick.bind(this);
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
    this.renderCircles();

    simulation
      .nodes(this.props.expenses)
      .alpha(0.9)
      .restart();
  }

  componentDidUpdate() {
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

    const perAngle = Math.PI / 6;
    const selectedWeekRadius = (this.props.width - margin.left - margin.right) / 2;

    // rectangle for each week
    const weeks = d3.timeWeek.range(weeksExtent[0], d3.timeWeek.offset(weeksExtent[1], 1));
    this.weeks = _.map(weeks, week => ({
      week,
      x: margin.left,
      y: yScale(week) + height,
    }));

    // circles for the back of each day in semi-circle
    this.days = _.map(daysOfWeek, (date) => {
      const [dayOfWeek, name] = date;
      const angle = Math.PI - perAngle * dayOfWeek;
      const x = selectedWeekRadius * Math.cos(angle) + this.props.width / 2;
      const y = selectedWeekRadius * Math.sin(angle) + margin.top;
      return {
        name,
        x,
        y,
      };
    });

    this.expenses = _.chain(this.props.expenses)
      .groupBy(d => d3.timeWeek.floor(d.date))
      .map((expenses, week) => {
        week = new Date(week);
        return _.map(expenses, (exp) => {
          const dayOfWeek = exp.date.getDay();
          let focusX = xScale(dayOfWeek);
          let focusY = yScale(week) + height;

          if (week.getTime() === this.props.selectedWeek.getTime()) {
            const angle = Math.PI - perAngle * dayOfWeek;

            focusX = selectedWeekRadius * Math.cos(angle) + this.props.width / 2;
            focusY = selectedWeekRadius * Math.sin(angle) + margin.top;
          }

          return Object.assign(exp, {
            focusX,
            focusY,
          });
        });
      })
      .flatten()
      .value();

    const amountExtent = d3.extent(this.expenses, d => d.amount);
    amountScale.domain(amountExtent);
  }

  forceTick() {
    this.circles.attr('cx', d => d.x).attr('cy', d => d.y);
  }

  renderCircles() {
    // draw expenses circles
    this.circles = this.container.selectAll('.expense').data(this.expenses, d => d.name);

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

  renderDays() {
    const days = this.container
      .selectAll('.day')
      .data(this.days, d => d.name)
      .enter()
      .append('g')
      .classed('day', true)
      .attr('transform', d => `translate(${[d.x, d.y]})`);

    const daysRadius = 80;
    const fontSize = 12;
    days
      .append('circle')
      .attr('r', daysRadius)
      .attr('fill', '#ccc')
      .attr('opacity', 0.25);

    days
      .append('text')
      .attr('y', daysRadius + fontSize)
      .attr('text-anchor', 'middle')
      .attr('dy', '.35em')
      .attr('fill', '#999')
      .style('font-weight', 600)
      .text(d => d.name);
  }

  renderWeeks() {
    const weeks = this.container
      .selectAll('.week')
      .data(this.weeks, d => d.name)
      .enter()
      .append('g')
      .classed('week', true)
      .attr('transform', d => `translate(${[d.x, d.y]})`);

    const rectHeight = 10;
    weeks
      .append('rect')
      .attr('y', -rectHeight / 2)
      .attr('width', this.props.width - margin.left - margin.right)
      .attr('height', rectHeight)
      .attr('fill', '#ccc')
      .attr('opacity', 0.25);

    const weekFormat = d3.timeFormat('%m/%d');
    weeks
      .append('text')
      .attr('text-anchor', 'end')
      .attr('dy', '.35em')
      .text(d => weekFormat(d.week));
  }

  render() {
    return <svg width={this.props.width} height={2 * height} ref={this.container} />;
  }
}

export default Expenses;
