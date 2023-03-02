import React from 'react';
import Dashboard from '../components/dashboard';
import allWidgets from '../myw';
import defaultLayout from './layout';

export default () => {
  return (
    <>
      <Dashboard
        widgets={allWidgets}
        defaultLayout={defaultLayout}
        widgetWrapStyle={widgetWrapStyle}
      />
    </>
  );
};

const widgetWrapStyle = {
  borderRadius: 10,
  boxShadow: '0 3px 3px rgba(128,128,128,0.2)',
};
