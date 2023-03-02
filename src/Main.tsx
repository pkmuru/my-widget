import React, { Component } from "react";
import { App } from "./App";
import Dashboard from "./components/dashboard";
import Widget from "./components/widget";
import WidgetSelector from "./components/widget/selector";
import Testpage from "./testpage";
import snapshot from './assets/images/snapshot.png';
export interface MainProps {
    app: App;
}

interface MainState {
}

export class Main extends Component<MainProps, MainState>
{
    constructor(props: MainProps) {
        super(props);
    }

    public render(): JSX.Element {
        return (
            <div>
                <Testpage />
                <img src={snapshot}/>
            </div>
        );
    }
}

