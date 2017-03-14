import React from 'react'

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
      filters: []
    }
  }

  componentDidMount () {
    window.setTimeout(() => {
      this.setState({
        filters: [{
          field: 'dc_dist',
          expression: {
            type: '=',
            value: '26'
          }
        }]
      })
    }, 2000)
  }

  render () {
    const widgets = this.props.widgets
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
                ChartType={ChartType} />
            </div>
          )
        })}
      </main>
    )
  }
}
