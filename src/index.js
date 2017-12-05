import { Component } from 'preact'

import VizwitBar from './components/VizwitBar'
import VizwitDateTime from './components/VizwitDateTime'

// Fixtures
import crimesByDistrict from '../test/fixtures/crimes-by-district.json'
import crimesByDate from '../test/fixtures/crimes-by-date.json'
import theftsByDistrict from '../test/fixtures/thefts-by-district.json'
import theftsByDate from '../test/fixtures/thefts-by-date.json'

export default class App extends Component {
  constructor () {
    super()
    this.state = {
      bar: {
        totals: [],
        filtered: [],
        selected: null
      },
      datetime: {
        totals: [],
        filtered: [],
        selected: null
      }
    }
  }
  render (props, state) {
    return (
      <main>
        <VizwitBar
          totals={state.bar.totals}
          filtered={state.bar.filtered}
          onSelect={(label) => console.log('Selected', label)}
          selected={state.bar.selected}
        />
        <VizwitDateTime
          totals={state.datetime.totals}
          filtered={state.datetime.filtered}
          onSelect={(labels) => console.log('Selected', labels)}
          selected={state.datetime.selected}
        />
      </main>
    )
  }
  componentDidMount () {
    // Debug
    window.setTimeout(this.setTotals.bind(this), 100)
    window.setTimeout(this.setFiltered.bind(this), 1000)
  }
  setTotals () {
    const bar = {
      ...this.state.bar,
      totals: crimesByDistrict.rows
    }
    const datetime = {
      ...this.state.datetime,
      totals: crimesByDate.rows
    }
    this.setState({ bar, datetime })
  }
  setFiltered () {
    const bar = {
      ...this.state.bar,
      filtered: theftsByDistrict.rows,
      selected: '12'
    }
    const datetime = {
      ...this.state.datetime,
      filtered: theftsByDate.rows,
      selected: ['2010-01-01T00:00:00Z', '2012-12-31T23:59:59Z']
    }
    this.setState({ bar, datetime })
  }
}
