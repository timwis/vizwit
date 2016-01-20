module.exports = {
  type: 'pie',
  theme: 'light',
  titleField: 'label',
  valueField: 'value',
  pulledField: 'pulled',
  innerRadius: '40%',
  groupPercent: 1,
  balloonFunction: function (item, formattedText) {
    var content = '<b>' + item.title + '</b><br>' +
      'Total: ' + item.value.toLocaleString() + ' (' + parseFloat(item.percents.toFixed(2)) + '%)'
    if (item.dataContext.filteredValue !== undefined) {
      content += '<br>Filtered Amount: ' + (+item.dataContext.filteredValue).toLocaleString()
    }
    return content
  },
  labelFunction: function (item, formattedText) {
    return item.title.length > 15 ? item.title.substr(0, 15) + '…' : item.title
  },
  balloon: {},
  autoMargins: false,
  marginTop: 0,
  marginBottom: 0,
  marginLeft: 0,
  marginRight: 0,
  pullOutRadius: '10%',
  pullOutOnlyOne: true,
  labelRadius: 1,
  pieAlpha: 0.8,
  hideLabelsPercent: 5,
  creditsPosition: 'bottom-right',
  startDuration: 0,
  addClassNames: true,
  responsive: {
    enabled: true,
    addDefaultRules: false,
    rules: [
      {
        maxWidth: 450,
        overrides: {
          pullOutRadius: '10%',
          titles: {
            enabled: false
          }
        }
      }
    ]
  }
}
