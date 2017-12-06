import { Component } from 'preact'
import { omit } from 'lodash'

import Carto from './providers/Carto'
import VizwitBar from './components/VizwitBar'
import VizwitDateTime from './components/VizwitDateTime'

import widgets from './pages/crime-incidents.json'

if (process.env.NODE_ENV !== 'production') require('preact/debug')

const Providers = {
  carto: Carto,
  default: Carto
}
const WidgetTypes = {
  bar: VizwitBar,
  datetime: VizwitDateTime,
  default: VizwitBar
}

export default class App extends Component {
  constructor () {
    super()
    this.state = {
      filters: {}
    }
  }
  render (props, state) {
    return (
      <main>
        {widgets.map((config, index) => {
          const Provider = Providers[config.provider] || Providers.default
          const WidgetType = WidgetTypes[config.chartType] || WidgetTypes.default
          return (
            <div key={index}>
              <Provider
                config={config}
                filters={state.filters}
                onFilter={this.onFilter.bind(this)}
                render={({ totaledRows, filteredRows, selected, onSelect }) => (
                  <WidgetType
                    totaledRows={totaledRows}
                    filteredRows={filteredRows}
                    selected={selected}
                    onSelect={onSelect}
                  />
                )}
              />
            </div>
          )
        })}
      </main>
    )
  }
  onFilter (field, expression) {
    let newFilters
    if (expression) {
      newFilters = {
        [field]: { field, expression }, // keep 'field' since filters is converted to array later
        ...this.state.filters
      }
    } else {
      newFilters = omit(this.state.filters, field)
    }
    this.setState({ filters: newFilters })
  }
}
