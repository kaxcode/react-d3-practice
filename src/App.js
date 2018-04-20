import React, { Component } from 'react';
import './App.css';
import * as d3 from 'd3';
import _ from 'lodash';
import Expenses from './components/Expenses';

import expensesData from './data/expenses.json';

const width = 900;

class App extends Component {
  state = {
    expenses: [],
    selectedWeek: null,
  };

  componentWillMount() {
    // process data
    const expenses = _.chain(expensesData)
      .filter(d => d.Amount < 0)
      .map(d => ({
        amount: -d.Amount,
        name: d.Description,
        date: new Date(d['Trans Date']),
      }))
      .value();

    // default selected week will be the most recent week
    const selectedWeek = d3.max(expenses, exp => d3.timeWeek.floor(exp.date));

    this.setState({ expenses, selectedWeek });
  }

  render() {
    const props = {
      width,
    };
    const selectedWeek = d3.timeFormat('%B %d, %Y')(this.state.selectedWeek);

    return (
      <div className="App">
        <h2>
          <span onClick={this.prevWeek}>←</span>
          Week of {selectedWeek}
          <span onClick={this.nextWeek}>→</span>
        </h2>
        <Expenses {...props} {...this.state} />
      </div>
    );
  }
}

export default App;
