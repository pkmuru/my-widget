import {
  CheckOutlined,
  CloseOutlined,
  DashboardOutlined,
  DeleteOutlined,
  PlusOutlined,
  ReloadOutlined,
  RetweetOutlined
} from '@ant-design/icons';
import { Button, Empty, message, Spin, Tooltip } from 'antd';
import classnames from 'classnames';
import _ from 'lodash';
import type { Component, FunctionComponent, ReactElement } from 'react';
import React, {
  forwardRef,

  useCallback,
  useEffect,
  useImperativeHandle,
  useMemo,
  useReducer,
  useRef,
  useState
} from 'react';
import { Responsive, WidthProvider } from 'react-grid-layout';
import KeyEvent from 'react-keyevent';
import { generateUuid, reducer } from '../utils';
import Widget from '../widget';
import WidgetSelector from '../widget/selector';
import { getWidgetType } from '../widget/utils';
import { Toolbar } from './components';
import './index.scss';
import { fetch as fetchApi, update as updateApi } from './service';
import './style/button.css';
import './style/empty.css';
import './style/input.css';
import './style/message.css';
import './style/modal.css';
import './style/spin.css';
import './style/tooltip.css';
import { calcMinAndMax, copy, formatLayout } from './utils';

const ResponsiveReactGridLayout: any = WidthProvider(Responsive);

export type LayoutItem = {
  w: number; //number of width copies, 12 copies in total
  h: number; //Height copies, 1 copy is about 30px
  x: number; //horizontal position, a total of 12 copies
  y: number; //Vertical position, 1 part is about 30px
  i: string; //unique identifier
  minW: number; //minimum width
  maxW: number; //maximum width
  minH: number; //minimum height
  maxH: number; //Maximum height
};
export type LayoutsIF = LayoutItem[];
export interface WidgetIF {
  name: string;
  description: string;
  tags: string[];
  component: Component | FunctionComponent;
  configComponent: Component | FunctionComponent | null;
  maxLength: number;
  snapShot: ImageBitmapSource;
  icon: ReactElement;
  iconBackground: string;
  size: {
    defaultWidth: number;
    defaultHeight: number;
    maxWidth: number;
    maxHeight: number;
    minWidth: number;
    minHeight: number;
  };
  [key: string]: any;
}
export interface WidgetsIF {
  [key: string]: WidgetIF;
}
export interface Dashboard {
  widgets: WidgetsIF; //widgets object
  editMode?: boolean; //Whether to edit the state
  defaultLayout?: LayoutsIF; //Initial layout
  widgetWrapClassName?: string; //widget container class name
  widgetWrapStyle?: React.CSSProperties; //widget container style
  layout?: LayoutsIF; //Layout data
  minHeight?: number; //minimum height
  maxWidgetLength?: number; //The maximum number of widgets that can be added to the current dashboard
  toolbar?: boolean; //Whether to display the default toolbar
  storageKey?: string; //Local storage unique identifier
  onLayoutChange?: (layout: LayoutsIF) => void;
  onReset?: (dirtyCurrentLayout: LayoutsIF, currentLayout: LayoutItem) => void; //clear

  onRemoveWidget?: (
    widget: WidgetIF,
    dirtyCurrentLayout: LayoutsIF,
    currentLayout: LayoutsIF,
  ) => void;//delete

  onAddWidget?: (
    widget: WidgetIF,
    dirtyCurrentLayout: LayoutsIF,
    currentLayout: LayoutsIF,
  ) => void; //add

  onReload?: (currentLayout: LayoutsIF) => void; // refresh

  onCancelEdit?: (
    dirtyCurrentLayout: LayoutsIF,
    currentLayout: LayoutItem,
  ) => void; //Cancel editing

  onEdit?: (currentLayout: LayoutsIF) => void; //edit

  onSave?: (currentLayout: LayoutsIF) => void; //edit

  onRevert?: (dirtyCurrentLayout: LayoutsIF, currentLayout: LayoutItem) => void; //reset

  [key: string]: any;
}

const Dashboard = forwardRef((props: Dashboard, ref: any) => {
  const {
    storageKey = 'default',
    editMode = false,
    widgets,
    defaultLayout = [],
    widgetWrapClassName,
    widgetWrapStyle,
    layout: customLayout = null,
    minHeight = 300,
    maxWidgetLength = 20,
    toolbar = true,
    onLayoutChange: _onLayoutChange,
    onReset, //clear
    onReload, //Refresh
    onRemoveWidget, //Delete
    onAddWidget, //add
    onCancelEdit, //Cancel editing
    onEdit, //Edit
    onRevert, //reset
    onSave, //Save
    ...restProps
  } = props;

  const [stateEditMode, setStateEditMode] = useState(editMode);
  const [loading, setLoading] = useState(editMode);

  const [state, dispatch] = useReducer(reducer, {
    currentLayout: [],
    dirtyCurrentLayout: [],
  });
  const { currentLayout = [], dirtyCurrentLayout = [] } = state;

  const dom = useRef<any>(null);

//get operation
const fetch = useCallback(
    _.debounce(async () => {
      try {
        const response = await fetchApi({ id: storageKey });
        let layout = _.isArray(defaultLayout) ? defaultLayout : [];
        if (response) {
          const resArr = JSON.parse(response).currentLayout;
          if (!_.isEmpty(resArr)) {
            layout = resArr;
          }
        }
        if (layout) {
          const data =calcMinAndMax(layout,widgets)
          dispatch({
            type: 'save',
            payload: {
              currentLayout: data,
              dirtyCurrentLayout: data,
            },
          });
        }
        setLoading(false);
      } catch (error) {}
    }, 200),
    [storageKey, widgets],
  );

// refresh
const reload = useCallback(async () => {
    setLoading(true);
    onReload && onReload(formatLayout(currentLayout));
    if (customLayout) {
      return;
    }
    fetch();
  }, [fetch, customLayout]);

//Set layout information
const update = useCallback(
    async (payload: any, callback: Function = () => {}) => {
      const layout = payload['layout'];

      try {
        const response = await updateApi({
          id: storageKey,
          data: {
            currentLayout: layout,
          },
        });
        if (!response) {
          return;
        }

        callback();
      } catch (error) {}
    },
    [storageKey, widgets],
  );

//Change the layout trigger
  const onLayoutChange = useCallback(
    _.debounce((layout: any, layouts?: any, callback?: Function) => {
      window.dispatchEvent(new Event('resize'));
      if (!stateEditMode) {
        return;
      }
      dispatch({
        type: 'save',
        payload: {
          dirtyCurrentLayout: layout,
        },
      });
      _onLayoutChange && _onLayoutChange(formatLayout(layout));
      callback && callback();
    }, 300),
    [stateEditMode],
  );

//add applet
const addWidget = useCallback(
    (widget: WidgetIF) => {
      if (dirtyCurrentLayout.length >= maxWidgetLength) {
        message.warning(
          `Exceeded the maximum limit ${maxWidgetLength}` + ',' + 'cannot add any more',
        );
      }
      const lastItem = dirtyCurrentLayout[dirtyCurrentLayout.length - 1];
      const newLayout = [
        ...dirtyCurrentLayout,
        {
          w: widget.size.defaultWidth,
          h: widget.size.defaultHeight,
          x: 0,
          y: lastItem ? lastItem['y'] + lastItem['h'] : 0,
          i: widget.name + '-' + generateUuid(),
          minW: widget.size.minWidth,
          maxW: widget.size.maxWidth,
          minH: widget.size.minHeight,
          maxH: widget.size.maxHeight,
        },
      ];
      onAddWidget &&
        onAddWidget(
          widget,
          formatLayout(dirtyCurrentLayout),
          formatLayout(newLayout),
        );
      onLayoutChange(newLayout);
      message.success('add successfully');

    },
    [dirtyCurrentLayout, onLayoutChange, maxWidgetLength],
  );

//Delete applet
const removeWidget = useCallback(
    (widgetKey: string) => {
      let removedWidget: any;
      let newLayout = _.cloneDeep(dirtyCurrentLayout);
      newLayout.map((item: WidgetIF, index: number) => {
        if (item['i'] === widgetKey) {
          removedWidget = item;
          newLayout.splice(index, 1);
        }
      });
      onRemoveWidget &&
        onRemoveWidget(
          removedWidget,
          formatLayout(dirtyCurrentLayout),
          formatLayout(newLayout),
        );
      dispatch({
        type: 'save',
        payload: {
          dirtyCurrentLayout: newLayout,
        },
      });
    },
    [dirtyCurrentLayout, onLayoutChange],
  );

  //重置
  const reset = useCallback(async () => {
    onReset && onReset([], formatLayout(currentLayout));
    onLayoutChange([]);
  }, [onLayoutChange]);

  //最终的布局数据
  const finLayout = useMemo(() => {
    return stateEditMode ? dirtyCurrentLayout : currentLayout;
  }, [stateEditMode, dirtyCurrentLayout, currentLayout]);

  //取消编辑
  const cancelEdit = useCallback(() => {
    setStateEditMode(false);
    onCancelEdit &&
      onCancelEdit(
        formatLayout(dirtyCurrentLayout),
        formatLayout(currentLayout),
      );
    dispatch({
      type: 'save',
      payload: {
        dirtyCurrentLayout: currentLayout,
      },
    });
  }, [dirtyCurrentLayout, currentLayout]);

  const revert = useCallback(() => {
    onRevert &&
      onRevert(formatLayout(dirtyCurrentLayout), formatLayout(currentLayout));
    dispatch({
      type: 'save',
      payload: {
        dirtyCurrentLayout: currentLayout,
      },
    });
  }, [dirtyCurrentLayout, currentLayout]);

  const edit = () => setStateEditMode(true);

  const save = useCallback(() => {
    dispatch({
      type: 'save',
      payload: {
        currentLayout: dirtyCurrentLayout,
        widgets,
      },
    });
    onSave && onSave(formatLayout(dirtyCurrentLayout));
    setStateEditMode(false);
    if (customLayout) {
      return;
    }
    update({
      layout: dirtyCurrentLayout,
    });
  }, [dirtyCurrentLayout, update, customLayout]);

  useImperativeHandle(ref, () => ({
    dom: dom.current,
    reset, //clear
    removeWidget, //delete
    addWidget, //add
    reload, // refresh
    cancelEdit, //cancel editing
    edit, //Edit
    revert, //reset
    save, // save
  }));

// print layout data
const onCtrlShiftC = useCallback(() => {
    const res = formatLayout(currentLayout);
    copy(JSON.stringify(res));
    message.success('Copied layout data to clipboard    ');
    console.log('currentLayout', res);
  }, [currentLayout]);

// default storage
useEffect(() => {
    if (customLayout) {
      return;
    }
    fetch();
  }, [customLayout]);

// edit state change side effects
useEffect(() => {
    setStateEditMode(editMode);
  }, [editMode]);

//response to external data

  useEffect(() => {
    if (!_.isArray(customLayout)) {
      return;
    }
    const data = calcMinAndMax(customLayout,widgets);
    dispatch({
      type: 'save',
      payload: {
        customLayout: data,
        dirtyCurrentLayout: data,
      },
    });
  }, [customLayout, widgets]);

  return (
    <Spin
      spinning={loading}
      style={{
        width: '100%',
      }}
    >
      <KeyEvent
        style={{
          width: '100%',
        }}
        events={{
          onCtrlShiftC,
        }}
        needFocusing
      >
        <div
          style={{
            width: '100%',
          }}
          ref={dom}
        >
          <ResponsiveReactGridLayout
            className="react-dashboard-layout"
            layouts={{ lg: finLayout }}
            rowHeight={30}
            isDraggable={stateEditMode}
            breakpoints={{ lg: 1200, md: 800, sm: 600, xs: 400, xxs: 300 }}
            cols={{ lg: 12, md: 12, sm: 2, xs: 2, xxs: 2 }}
         // onBreakpointChange={onBreakpointChange} //breakpoint callback
         onLayoutChange={onLayoutChange} //Layout change callback
         isResizable={stateEditMode} //Allow resizing
         // onWidthChange={()=>onWidthChange()} //Width change callback
         measureBeforeMount //Animation related
          >
            {finLayout.map((item: any) => (
              <div
                key={item.i}
                className={classnames(
                  'react-dashboard-item',
                  stateEditMode ? 'react-dashboard-item-edit' : '',
                )}
              >
                {widgets[getWidgetType(item.i, widgets)] ? (
                  <Widget
                    {...restProps}
                    widgetKey={item.i}
                    widgetType={getWidgetType(item.i, widgets)}
                    height={item.h * 40 - 10}
                    editMode={stateEditMode}
                    onDeleteWidget={() => removeWidget(item.i)}
                    widgets={widgets}
                    widgetWrapClassName={widgetWrapClassName}
                    widgetWrapStyle={widgetWrapStyle}
                  />
                ) : (
                  <div className="react-dashboard-aligncenter react-dashboard-full">
                    <div style={{ textAlign: 'center' }}>
                      <div>
                        {'Data Error'} {item.i}
                      </div>
                      {stateEditMode && (
                        <Button
                          icon={<DeleteOutlined />}
                          size="small"
                          style={{ margin: '10px 0' }}
                          onClick={() => removeWidget(item.i)}
                        >
                          {'Delete'}
                        </Button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </ResponsiveReactGridLayout>

          {toolbar && finLayout.length > 0 ? (
            !stateEditMode && (
              <div
                style={{
                  display: 'flex',
                  margin: '0 10px',
                  marginBottom: '10px',
                }}
              >
                <Button
                  size="small"
                  icon={<ReloadOutlined />}
                  loading={loading}
                  style={{ marginRight: '10px' }}
                  onClick={() => reload()}
                />
                <Button
                  size="small"
                  type="default"
                  style={{ flex: 1 }}
                  onClick={edit}
                >
                  <DashboardOutlined />
                  {'Edit dashboard'}
                </Button>
              </div>
            )
          ) : (
            <>
              {!stateEditMode ? (
                <Spin spinning={loading}>
                  <div
                    className="react-dashboard-emptyContent"
                    style={{ minHeight }}
                  >
                    {!loading && (
                      <Empty
                        description={<span>{'The current dashboard has no applets'}</span>}
                      >
                        <Button size="small" type="primary" onClick={edit}>
                          <DashboardOutlined />
                          {'Edit dashboard'}
                        </Button>
                      </Empty>
                    )}
                  </div>
                </Spin>
              ) : (
                <div
                  className={classnames(
                    'react-dashboard-full',
                    'react-dashboard-aligncenter',
                  )}
                  style={{ minHeight }}
                >
                  <WidgetSelector
                    widgets={widgets}
                    currentLayout={finLayout}
                    addWidget={addWidget}
                  >
                    <>
                      <Tooltip title={'Add to'}>
                        <Button
                          type="dashed"
                          shape="circle"
                          icon={<PlusOutlined />}
                          size="large"
                        />
                      </Tooltip>
                    </>
                  </WidgetSelector>
                </div>
              )}
            </>
          )}

          {toolbar && stateEditMode && (
            <Toolbar
              fixed={false}
              extraRight={
                <>
                  <Button
                    size="small"
                    onClick={cancelEdit}
                    icon={<CloseOutlined />}
                  >
                    {'Cancel'}
                  </Button>
                  <Button
                    size="small"
                    onClick={revert}
                    icon={<RetweetOutlined />}
                  >
                    {'recover'}
                  </Button>
                  {!_.isEmpty(finLayout) && (
                    <Button
                      size="small"
                      danger
                      onClick={reset}
                      icon={<DeleteOutlined />}
                    >
                      {'empty'}
                    </Button>
                  )}
                  <WidgetSelector
                    widgets={widgets}
                    currentLayout={finLayout}
                    addWidget={addWidget}
                  />
                  <Button
                    size="small"
                    onClick={save}
                    type="primary"
                    icon={<CheckOutlined />}
                  >
                    {'keep'}
                  </Button>
                </>
              }
            />
          )}
        </div>
      </KeyEvent>
    </Spin>
  );
});

export default Dashboard;
