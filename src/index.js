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
        totaledRows: [],
        filteredRows: [],
        selected: null
      },
      datetime: {
        totaledRows: [],
        filteredRows: [],
        selected: null
      }
    }
  }
  render (props, state) {
    return (
      <main>
        <VizwitBar
          totaledRows={state.bar.totaledRows}
          filteredRows={state.bar.filteredRows}
          onSelect={(label) => console.log('Selected', label)}
          selected={state.bar.selected}
        />
        <VizwitDateTime
          totaledRows={state.datetime.totaledRows}
          filteredRows={state.datetime.filteredRows}
          onSelect={(labels) => console.log('Selected', labels)}
          selected={state.datetime.selected}
        />
      </main>
    )
  }
  componentDidMount () {
    // Debug
    window.setTimeout(this.setTotaled.bind(this), 100)
    window.setTimeout(this.setFiltered.bind(this), 1000)
  }
  setTotaled () {
    const bar = {
      ...this.state.bar,
      totaledRows: crimesByDistrict.rows
    }
    const datetime = {
      ...this.state.datetime,
      totaledRows: crimesByDate.rows
    }
    this.setState({ bar, datetime })
  }
  setFiltered () {
    const bar = {
      ...this.state.bar,
      filteredRows: theftsByDistrict.rows,
      selected: '12'
    }
    const datetime = {
      ...this.state.datetime,
      filteredRows: theftsByDate.rows,
      selected: ['2010-01-01T00:00:00Z', '2012-12-31T23:59:59Z']
    }
    this.setState({ bar, datetime })
  }
}
