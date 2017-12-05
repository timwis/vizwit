import { Component } from 'preact'
import Plottable from 'plottable'
import 'plottable/plottable.css'

import { arrayify } from '../helpers'

export default class VizwitBar extends Component {
  render () {
    const style = { height: 400 }
    const saveRef = (el) => (this.container = el)
    return <div ref={saveRef} style={style} />
  }
  componentDidMount () {
    const { totaledRows, filteredRows, onSelect, selected } = this.props

    this.totaledRowsDataset = new Plottable.Dataset(totaledRows)
      .metadata({ colorBucket: 5 })
    this.filteredRowsDataset = new Plottable.Dataset(filteredRows)
      .metadata({ colorBucket: 3 })

    const xScale = new Plottable.Scales.Category()
    const xAxis = new Plottable.Axes.Category(xScale, 'bottom')

    const yScale = new Plottable.Scales.Linear()
    const colorScale = new Plottable.Scales.InterpolatedColor()
      .range(['#5279C7', '#BDCEF0'])

    this.plot = new Plottable.Plots.Bar()
      .addDataset(this.totaledRowsDataset)
      .addDataset(this.filteredRowsDataset)
      .attr('fill', (datum, index, dataset) => dataset.metadata().colorBucket, colorScale)
      .x((datum) => datum.label, xScale)
      .y((datum) => datum.value, yScale)
      .animated(true)
      // .labelsEnabled(true)

    this.selectedDataset = new Plottable.Dataset(arrayify(selected))
    const rectangle = new Plottable.Plots.Rectangle()
      .addDataset(this.selectedDataset)
      .x((datum) => datum, xScale)
      .y(0)
      .y2((datum) => rectangle.height())
      .attr('fill', '#f99300')
      .attr('opacity', 0.3)

    xScale.innerPadding(0.4) // See https://github.com/palantir/plottable/issues/3426

    const group = new Plottable.Components.Group([ this.plot, rectangle ])

    if (onSelect) {
      const interaction = new Plottable.Interactions.Click()
      interaction.onClick(this.onClickPlot.bind(this))
      interaction.attachTo(this.plot)
    }

    const table = new Plottable.Components.Table([
      [group],
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
    if (this.props.totaledRows !== nextProps.totaledRows) {
      this.plot.animated(true)
      this.totaledRowsDataset.data(nextProps.totaledRows)
    }
    if (this.props.filteredRows !== nextProps.filteredRows) {
      this.plot.animated(false)
      this.filteredRowsDataset.data(nextProps.filteredRows)
    }
    if (this.props.selected !== nextProps.selected) {
      this.plot.animated(false)
      this.selectedDataset.data(arrayify(nextProps.selected))
    }
    return false
  }
}
