import React from 'react'
import ReactDOM from 'react-dom'

import App from './App'
import './index.css'

import widgets from './pages/crime-incidents.json'

ReactDOM.render(
  <App widgets={widgets} />,
  document.getElementById('root')
)
