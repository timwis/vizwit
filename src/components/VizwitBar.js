import { Component } from 'preact'
import Plottable from 'plottable'
import 'plottable/plottable.css'

export default class VizwitBar extends Component {
  render () {
    const style = { height: 400 }
    const saveRef = (el) => (this.container = el)
    return <div ref={saveRef} style={style} />
  }
  componentDidMount () {
    const { totals, filtered, onSelect } = this.props

    this.totalsDataset = new Plottable.Dataset(totals).metadata(5)
    this.filteredDataset = new Plottable.Dataset(filtered).metadata(3)

    const xScale = new Plottable.Scales.Category()
    const yScale = new Plottable.Scales.Linear()
    const colorScale = new Plottable.Scales.InterpolatedColor()
    colorScale.range(['#5279C7', '#BDCEF0'])

    const xAxis = new Plottable.Axes.Category(xScale, 'bottom')

    this.plot = new Plottable.Plots.Bar()
      .addDataset(this.totalsDataset)
      .addDataset(this.filteredDataset)
      .attr('fill', (d, i, dataset) => dataset.metadata(), colorScale)
      .x((d) => d.label, xScale)
      .y((d) => d.value, yScale)
      .animated(true)
      .labelsEnabled(true)

    if (onSelect) {
      const interaction = new Plottable.Interactions.Click()
      interaction.onClick(this.onClickPlot.bind(this))
      interaction.attachTo(this.plot)
    }

    const table = new Plottable.Components.Table([
      [this.plot],
      [xAxis]
    ])

    table.renderTo(this.container)
  }
  onClickPlot (point) {
    const entities = this.plot.entitiesAt(point)
    if (entities.length > 0) {
      const label = entities[0].datum.label
      this.props.onSelect(label)
    }
  }
  shouldComponentUpdate (nextProps) {
    if (this.props.totals !== nextProps.totals) {
      this.plot.animated(true)
      this.totalsDataset.data(nextProps.totals)
    }
    if (this.props.filtered !== nextProps.filtered) {
      this.plot.animated(false)
      this.filteredDataset.data(nextProps.filtered)
    }
    return false
  }
}
