import React from 'react';
import _ from 'lodash';
import './App.css';
import Expenses from './components/Expenses';
import expensesData from './data/expenses.json';

const width = 900;

class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = { expenses: [] };
  }

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

    this.setState({ expenses });
  }

  render() {
    const props = {
      width,
    };

    return <Expenses {...props} {...this.state} />;
  }
}

export default App;
