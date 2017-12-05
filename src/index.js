import { Component } from 'preact'

import Carto from './providers/Carto'
import VizwitBar from './components/VizwitBar'
import VizwitDateTime from './components/VizwitDateTime'

import widgets from './pages/crime-incidents.json'

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
                render={({ totaledRows, filteredRows, onSelect }) => (
                  <WidgetType
                    totaledRows={totaledRows}
                    filteredRows={filteredRows}
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
    console.log('filtering', field, expression)
  }
}
