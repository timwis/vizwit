import React from 'react'
import {Line} from 'react-chartjs-2'
import {keyBy} from 'lodash'

const colors = {
  active: 'rgba(33, 118, 210, 0.2)', // ben-franklin-blue
  inactive: 'rgba(33, 118, 210, 0.03)',
  border: 'rgba(15, 77, 144, 1)'
}

export default class DateTime extends React.Component {
  render () {
    console.log('dating timing')
    const { totalRows, filteredRows } = this.props
    const labels = totalRows.map((row) => row.label)
    const totalValues = totalRows.map((row) => row.value)
    const isFiltered = (filteredRows.length > 0)

    const chartData = {
      labels,
      datasets: [
        {
          label: 'Total',
          type: 'line',
          data: totalValues,
          backgroundColor: isFiltered ? colors.inactive : colors.active,
          borderColor: colors.border,
          borderWidth: 1
        }
      ]
    }

    if (isFiltered) {
      const filteredValues = getSpacedOutFilteredValues(filteredRows, totalRows)

      chartData.datasets.push({
        label: 'Filtered',
        data: filteredValues,
        backgroundColor: colors.active,
        borderColor: colors.border,
        borderWidth: 1
      })
    }

    const options = {
      maintainAspectRatio: false,
      tooltips: {
        mode: 'x-axis'
      },
      scales: {
        yAxes: [{
          ticks: {
            beginAtZero: true
          }
        }],
        xAxes: [{
          type: 'time',
          distribution: 'series',
          stacked: true
        }]
      }
    }

    return <Line
            data={chartData}
            options={options}
            width={600}
            height={500}
            getElementAtEvent={this.onClick.bind(this)} />
  }

  onClick (elements) {
    if (elements.length) {
      const index = elements[0]._index
      const label = this.props.totalRows[index].label
      this.props.onSelect(label)
    }
  }
}

// Server API won't return rows with 0 value, resulting in the 2 datasets
// being in the wrong order (filtered may only have 1 item).
// Here we convert it back to [0, 0, 0, X, 0]
function getSpacedOutFilteredValues (filteredRows, totalRows) {
  const filteredRowsByLabel = keyBy(filteredRows, 'label')
  const filteredValues = totalRows.map((row) => {
    const match = filteredRowsByLabel[row.label]
    return match ? match.value : 0
  })
  return filteredValues
}
