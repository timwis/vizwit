import React from 'react'
import {assoc, dissoc} from 'ramda'

import Carto from './providers/Carto'
import BarChart from './chart-types/BarChart'
import './App.css'

const Providers = {
  carto: Carto
}

const ChartTypes = {
  bar: BarChart
}

export default class App extends React.Component {
  constructor (props) {
    super(props)
    this.state = {
      filters: {}
    }
  }

  render () {
    const widgets = this.props.widgets || []
    return (
      <main>
        {widgets.map((widget, index) => {
          const Provider = Providers[widget.provider] || Carto
          const ChartType = ChartTypes[widget.chartType] || BarChart
          return (
            <div key={index}>
              <Provider
                config={widget}
                filters={this.state.filters}
                ChartType={ChartType}
                onFilter={this.onFilter.bind(this)} />
            </div>
          )
        })}
      </main>
    )
  }

  onFilter (field, expression) {
    let newFilters
    if (expression) {
      const newFilter = { field, expression } // keep 'field' since filters is converted to array later
      newFilters = assoc(field, newFilter, this.state.filters)
    } else {
      newFilters = dissoc(field, this.state.filters)
    }
    this.setState({ filters: newFilters })
  }
}
