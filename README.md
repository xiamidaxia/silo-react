# Silo-React

React state manager based on redux

[![Build Status](https://img.shields.io/travis/xiamidaxia/silo-react.svg?style=flat)](https://travis-ci.org/xiamidaxia/silo-react)
[![Coverage Status](https://img.shields.io/coveralls/xiamidaxia/silo-react.svg?style=flat)](https://coveralls.io/r/xiamidaxia/silo-react)
[![NPM downloads](http://img.shields.io/npm/dm/silo-react.svg?style=flat)](https://npmjs.org/package/silo-react)
[![Dependencies](https://david-dm.org/xiamidaxia/silo-react/status.svg)](https://david-dm.org/xiamidaxia/silo-react)

## Quick start

```javscript
import { createSiloStore, createStore, Provider, connect } from 'silo-react'

const store = createSiloStore()


ReactDOM.render(
<Provider store={store}>
</Provider>
)

```

## Redux Middleware
