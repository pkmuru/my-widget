import { AppstoreAddOutlined, PlusOutlined, SearchOutlined } from '@ant-design/icons';
import { Button, Drawer, Empty, Input } from 'antd';
import classnames from 'classnames';
import _ from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import './index.scss';

const Search = Input.Search;

const WidgetSelector = (props: any) => {
  const {
    widgets,
    currentLayout,
    addWidget,
    children = (
      <Button
        size="small"
        type="primary"
        icon={<PlusOutlined />}
        style={{ marginLeft: '10px' }}
      >
        {'Add to'}
      </Button>
    ),
  } = props;

  const [visible, setVisible] = useState<boolean>(false);
  const [width] = useState<number>(600);
  const [menuData, setMenuData] = useState([]);
  const [activeMenuKey, setActiveMenuKey] = useState<string>('');
  const [keywords, setKeywords] = useState('');

  //Calculate the left menu
  const handleCalcMenuData = useCallback(() => {
    let tags: string[] = [];
    Object.keys(widgets).map((key) => {
      const item = widgets[key];
      tags.push(...item['tags']);
    });
    const tempObj: any = {};
    tags.map((item) => {
      if (tempObj[item]) {
        tempObj[item]['count']++;
      } else {
        tempObj[item] = {
          title: item,
          count: 1,
        };
      }
    });
    const menuData: any = [];
    Object.keys(tempObj).map((key, index, arr) => {
      menuData.push(tempObj[key]);
    });
    setMenuData(menuData);
  }, [widgets]);

//menu changes
const handleMenuChange = useCallback((item, index) => {
    setActiveMenuKey(item.title);
  }, []);

//Inquire
const handleSearch = useCallback((value) => {
    setActiveMenuKey(menuData[0].title);
    setKeywords(value);
  }, [menuData]);

  useEffect(() => {
    handleCalcMenuData();
  }, []);

  const finWidgets = useMemo(() => {
    const finData = _.cloneDeep(widgets);
    Object.keys(finData).map((key) => {
//Initialization data
finData[key].length = 0;
      finData[key].visible = true;
//menu switching
if (finData[key]['tags'].indexOf(activeMenuKey) < 0 && activeMenuKey) {
        finData[key].visible = false;
      }
//Inquire
if (
        finData[key]['name'].toLowerCase().indexOf(keywords.toLowerCase()) <
        0 &&
        finData[key]['description']
          .toLowerCase()
          .indexOf(keywords.toLowerCase()) < 0
      ) {
        finData[key].visible = false;
      }
    });
    console.log('finData', finData)
//Added times
currentLayout.forEach((item: any) => {
      const key = item.i.split('-')[0];
      console.log('item.i', item.i)
      console.log('finData[key]', finData[key])
      finData[key].length = finData[key].length ? finData[key]?.length + 1 : 1;
    });
    return finData;
  }, [currentLayout, widgets, keywords, activeMenuKey, visible]);

  return (
    <>
      <div
        style={{ display: 'inline-block' }}
        onClick={() => {
          setVisible(true);
        }}
      >
        {children}
      </div>
      <Drawer
        // className="react-dashboard-widget-selector"
        width={width}
        title={
          <>
            <AppstoreAddOutlined style={{ margin: '0 5px' }} />
            {'select applet'}
          </>
        }
        visible={visible}
        onClose={() => {
          setVisible(false);
        }}
        footer={null}
        bodyStyle={{ padding: 0 }}
        zIndex={1006}
      >
        <div className={'react-dashboard-widget-wrap'}>
          <div className={'react-dashboard-widget-leftBar'}>
            <Search
              placeholder={'Please enter the applet name'}
              value={keywords}
              onSearch={handleSearch}
              onChange={(e) => handleSearch(e.target.value)}
              prefix={
                <SearchOutlined
                  className={'react-dashboard-widget-searchIcon'}
                />
              }
              allowClear
              enterButton
            />
            <div style={{ marginTop: 10 }}>
              {menuData.map((item, index) => (
                <div
                  className={classnames(
                    'react-dashboard-widget-item',
                    activeMenuKey == item.title
                      ? 'react-dashboard-widget-active'
                      : '',
                  )}
                  key={item.title}
                  onClick={() => handleMenuChange(item, index)}
                >
                  <div className={'react-dashboard-widget-name'}>
                    {item['title']}
                  </div>
                  <div className={'react-dashboard-widget-Badge'}>
                    {item.count}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div
            className={classnames('react-dashboard-widget-Layer')}
            style={{
              height: '100%',
              overflowY: 'auto',
            }}
          >
            {!_.isEmpty(finWidgets) ? (
              <div
                className="react-dashboard-widget-waterfall"
                style={{ columnCount: Math.ceil((width - 200) / 200) }}
              >
                {Object.keys(finWidgets).map((key) => {
                  const item = finWidgets[key];
                  return (
                    <div
                      key={key}
                      className={classnames('react-dashboard-widget-item')}
                      style={{
                        display: item.visible ? 'block' : 'none',
                      }}
                    >
                      <img
                        src={item['snapShot']}
                        alt='Hello'
                        className={'react-dashboard-widget-shortcut'}
                      />
                      <div className={'react-dashboard-widget-bottombar'}>
                        <div
                          className={'react-dashboard-widget-iconWrap'}
                          style={{
                            backgroundColor: _.get(
                              widgets,
                              key + '.iconBackground',
                            ),
                            backgroundImage: _.get(
                              widgets,
                              key + '.iconBackground',
                            ),
                          }}
                        >
                          {item.icon}
                        </div>
                        <div className={'react-dashboard-widget-name'}>
                          {item.name}
                        </div>
                        <div className={'react-dashboard-widget-description'}>
                          {item.description}
                        </div>
                      </div>
                      <div className={'react-dashboard-widget-mask'}>
                        {item.length < item.maxLength ? (
                          <Button
                            type="primary"
                            shape="circle"
                            icon={<PlusOutlined />}
                            size="large"
                            onClick={() => addWidget(item, key)}
                          />
                        ) : (
                          <div
                            style={{
                              padding: 20,
                              color: '#fff',
                              fontWeight: 'bold',
                            }}
                          >
                            {'This applet can add up to'}
                            {item.maxLength}
                            {'indivual'}
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div
                className="react-dashboard-widget-emptyContent"
                style={{ minHeight: 'calc(100% - 20px)' }}
              >
                <Empty description={<span>{'There are no applets under this condition'}</span>} />
              </div>
            )}
          </div>
        </div>
      </Drawer>
    </>
  );
};

export default WidgetSelector;
