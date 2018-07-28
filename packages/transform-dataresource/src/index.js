/* @flow */
import { hot } from "react-hot-loader";

import * as React from "react";
import { DatabaseOcticon, Beaker } from "@nteract/octicons";

import { colors } from "./settings";
import { semioticSettings } from "./charts/settings";
import { DataResourceTransformGrid } from "./charts/grid";
import VizControls from "./VizControls";

import {
  TreeIcon,
  NetworkIcon,
  BoxplotIcon,
  ScatterplotIcon,
  LineChartIcon,
  BarChartIcon,
  HexbinIcon,
  ParallelCoordinatesIcon
} from "./icons";

type Props = {
  data: Object,
  metadata: Object,
  theme?: string,
  expanded?: boolean,
  height?: number
};

type LineType = "line" | "stackedarea" | "bumparea" | "stackedpercent";

type State = {
  view:
    | "line"
    | "bar"
    | "scatter"
    | "grid"
    | "network"
    | "summary"
    | "hexbin"
    | "parallel",
  colors: Array<string>,
  metrics: Array<Object>,
  dimensions: Array<Object>,
  selectedMetrics: Array<string>,
  selectedDimensions: Array<string>,
  networkType: "force" | "sankey",
  hierarchyType: "dendrogram" | "treemap" | "partition",
  pieceType: "bar" | "point" | "swarm" | "clusterbar",
  colorValue: string,
  sizeValue: string,
  xValue: string,
  yValue: string,
  targetDimension: string,
  sourceDimension: string,
  labelValue: string,
  summaryType: "violin" | "joy" | "histogram" | "heatmap" | "boxplot",
  lineType: LineType,
  chart: Object,
  displayChart: Object,
  primaryKey: Array<string>,
  data: Array<Object>
};

const generateChartKey = ({
  view,
  lineType,
  selectedDimensions,
  selectedMetrics,
  pieceType,
  summaryType,
  networkType,
  hierarchyType,
  chart
}) =>
  `${view}-${lineType}-${selectedDimensions.join(",")}-${selectedMetrics.join(
    ","
  )}-${pieceType}-${summaryType}-${networkType}-${hierarchyType}-${JSON.stringify(
    chart
  )}`;

/*
  contour is an option for scatterplot
  pie is a transform on bar
*/

const MetadataWarning = ({ metadata }) => {
  const warning =
    metadata && metadata.sampled ? (
      <span>
        <b>NOTE:</b> This data is sampled
      </span>
    ) : null;

  return (
    <div
      style={{
        fontFamily:
          "Source Sans Pro, Helvetica Neue, Helvetica, Arial, sans-serif"
      }}
    >
      <div
        style={{
          backgroundColor: "#cec",
          color: "#111",
          padding: "10px",
          paddingLeft: "20px"
        }}
      >
        This interactive data explorer is in the works.{" "}
        <a
          href="https://github.com/nteract/nteract/issues/new"
          style={{
            color: "#333"
          }}
        >
          Help us improve it!
        </a>
        <Beaker
          style={{
            color: "#111",
            verticalAlign: "center",
            textAlign: "center",
            paddingLeft: "10px"
          }}
        />
      </div>
      {warning ? (
        <div
          style={{
            backgroundColor: "#cce",
            padding: "10px",
            paddingLeft: "20px"
          }}
        >
          {warning}
        </div>
      ) : null}
    </div>
  );
};

///////////////////////////////

class DataResourceTransform extends React.Component<Props, State> {
  static MIMETYPE = "application/vnd.dataresource+json";

  static defaultProps = {
    metadata: {},
    height: 500
  };

  constructor(props: Props) {
    super(props);
    //DEFAULT FROM PROPS

    const { fields = [], primaryKey = [] } = props.data.schema;

    const dimensions = fields.filter(
      d => d.type === "string" || d.type === "boolean" || d.type === "datetime"
    );

    //Should datetime data types be transformed into js dates before getting to this resource?
    const data = props.data.data.map(d => {
      const mappedD = { ...d };
      fields.forEach(p => {
        if (p.type === "datetime") {
          mappedD[p.name] = new Date(mappedD[p.name]);
        }
      });
      return mappedD;
    });

    const metrics = fields
      .filter(
        d =>
          d.type === "integer" || d.type === "number" || d.type === "datetime"
      )
      .filter(d => !primaryKey.find(p => p === d.name));

    this.state = {
      view: "grid",
      lineType: "line",
      selectedDimensions: [],
      selectedMetrics: [],
      pieceType: "bar",
      summaryType: "violin",
      networkType: "force",
      hierarchyType: "dendrogram",
      colorValue: "none",
      labelValue: "none",
      sizeValue: "none",
      sourceDimension: "none",
      targetDimension: "none",
      xValue: "none",
      yValue: "none",
      dimensions,
      metrics,
      colors,
      ui: {},
      chart: {
        metric1: (metrics[0] && metrics[0].name) || "none",
        metric2: (metrics[1] && metrics[1].name) || "none",
        metric3: "none",
        dim1: (dimensions[0] && dimensions[0].name) || "none",
        dim2: (dimensions[1] && dimensions[1].name) || "none",
        timeseriesSort: "array-order"
      },
      displayChart: {},
      primaryKey: [],
      data
    };
  }

  //SET STATE WHENEVER CHANGES

  //HELD IN STATE LIKE SO
  //UI CHOICES
  //CHART CHOICES
  //DERIVED DATA

  shouldComponentUpdate(): boolean {
    return true;
  }

  updateChart = (updatedState: Object) => {
    const {
      view,
      dimensions,
      metrics,
      chart,
      lineType,
      selectedDimensions,
      selectedMetrics,
      pieceType,
      summaryType,
      networkType,
      hierarchyType,
      colors,
      primaryKey,
      data: stateData
    } = { ...this.state, ...updatedState };

    const { data, height = 500 } = this.props;

    const { Frame, chartGenerator } = semioticSettings[view];

    const chartKey = generateChartKey({
      view,
      lineType,
      selectedDimensions,
      selectedMetrics,
      pieceType,
      summaryType,
      networkType,
      hierarchyType,
      chart
    });

    const frameSettings = chartGenerator(stateData, data.schema, {
      metrics,
      chart,
      colors,
      height,
      lineType,
      selectedDimensions,
      selectedMetrics,
      pieceType,
      summaryType,
      networkType,
      hierarchyType,
      primaryKey,
      setColor: this.setColor
    });

    const display = (
      <div style={{ marginLeft: "50px", width: "calc(100% - 50px)" }}>
        <Frame
          responsiveWidth={true}
          size={[500, height - 200]}
          {...frameSettings}
        />
        <VizControls
          {...{
            view,
            chart,
            metrics,
            dimensions,
            selectedDimensions,
            hierarchyType,
            summaryType,
            networkType,
            updateChart: this.updateChart
          }}
        />
        <style jsx>{`
          :global(.tooltip-content) {
            color: black;
            padding: 10px;
            z-index: 999999;
            min-width: 120px;
            background: white;
            border: 1px solid black;
            position: relative;
            transform: translate(calc(-50% + 7px), calc(0% + 9px));
          }
          :global(.tooltip-content:before) {
            border-left: inherit;
            border-top: inherit;
            top: -8px;
            left: calc(50% - 15px);
            background: inherit;
            content: "";
            padding: 0px;
            transform: rotate(45deg);
            width: 15px;
            height: 15px;
            position: absolute;
            z-index: 99;
          }

          :global(.tick > path) {
            stroke: lightgray;
          }

          :global(.axis-labels) {
            fill: lightgray;
          }
          :global(.axis-baseline) {
            stroke-opacity: 0.25;
          }
          :global(circle.frame-hover) {
            fill: none;
            stroke: gray;
          }
          :global(.rect) {
            stroke: green;
            stroke-width: 5px;
            stroke-opacity: 0.5;
          }
          :global(rect.selection) {
            opacity: 0.5;
          }
        `}</style>
      </div>
    );

    this.setState({
      displayChart: {
        ...this.state.displayChart,
        [chartKey]: display
      },
      ...updatedState
    });
  };

  setGrid = () => {
    this.setState({ view: "grid" });
  };

  setLine = () => {
    this.updateChart({ view: "line" });
  };

  setParallel = () => {
    this.updateChart({ view: "parallel" });
  };

  setBar = () => {
    this.updateChart({ view: "bar" });
  };

  setScatter = () => {
    this.updateChart({ view: "scatter" });
  };

  setHexbin = () => {
    this.updateChart({ view: "hexbin" });
  };

  setSummary = () => {
    this.updateChart({ view: "summary" });
  };

  setNetwork = () => {
    this.updateChart({ view: "network" });
  };

  setHierarchy = () => {
    this.updateChart({ view: "hierarchy" });
  };

  setColor = newColorArray => {
    this.updateChart({ colors: newColorArray });
  };

  setLineType = (e: LineType) => {
    this.updateChart({ lineType: e });
  };

  updateDimensions = (e: string) => {
    const oldDims = this.state.selectedDimensions;
    const newDimensions =
      oldDims.indexOf(e) === -1
        ? [...oldDims, e]
        : oldDims.filter(d => d !== e);
    this.updateChart({ selectedDimensions: newDimensions });
  };
  updateMetrics = (e: string) => {
    const oldDims = this.state.selectedMetrics;
    const newMetrics =
      oldDims.indexOf(e) === -1
        ? [...oldDims, e]
        : oldDims.filter(d => d !== e);
    this.updateChart({ selectedMetrics: newMetrics });
  };

  render(): ?React$Element<any> {
    const {
      view,
      dimensions,
      chart,
      lineType,
      selectedDimensions,
      selectedMetrics,
      pieceType,
      summaryType,
      networkType,
      hierarchyType
    } = this.state;

    let display = null;

    if (view === "grid") {
      display = <DataResourceTransformGrid {...this.props} />;
    } else if (
      [
        "line",
        "scatter",
        "bar",
        "network",
        "summary",
        "hierarchy",
        "hexbin",
        "parallel"
      ].includes(view)
    ) {
      const chartKey = generateChartKey({
        view,
        lineType,
        selectedDimensions,
        selectedMetrics,
        pieceType,
        summaryType,
        networkType,
        hierarchyType,
        chart
      });

      display = this.state.displayChart[chartKey];
    }

    return (
      <div>
        <MetadataWarning metadata={this.props.metadata} />
        <div
          style={{
            display: "flex",
            flexFlow: "row nowrap",
            width: "100%",
            height: this.props.height
          }}
        >
          <div
            style={{
              flex: "1"
            }}
          >
            {display}
          </div>
          <div
            style={{
              display: "flex",
              flexFlow: "column nowrap"
            }}
          >
            <IconButton onClick={this.setGrid} message={"Data Table"}>
              <DatabaseOcticon />
            </IconButton>
            {dimensions.length > 0 && (
              <IconButton onClick={this.setBar} message={"Bar Graph"}>
                <BarChartIcon />
              </IconButton>
            )}
            <IconButton onClick={this.setSummary} message={"Summary"}>
              <BoxplotIcon />
            </IconButton>
            <IconButton onClick={this.setScatter} message={"Scatter Plot"}>
              <ScatterplotIcon />
            </IconButton>
            <IconButton onClick={this.setHexbin} message={"Area Plot"}>
              <HexbinIcon />
            </IconButton>
            {dimensions.length > 1 && (
              <IconButton onClick={this.setNetwork} message={"Network"}>
                <NetworkIcon />
              </IconButton>
            )}
            {dimensions.length > 0 && (
              <IconButton onClick={this.setHierarchy} message={"Hierarchy"}>
                <TreeIcon />
              </IconButton>
            )}
            {dimensions.length > 0 && (
              <IconButton
                onClick={this.setParallel}
                message={"Parallel Coordinates"}
              >
                <ParallelCoordinatesIcon />
              </IconButton>
            )}
            <IconButton onClick={this.setLine} message={"Line Graph"}>
              <LineChartIcon />
            </IconButton>
          </div>
        </div>
      </div>
    );
  }
}

/////////////////////////////

type IconButtonProps = {
  message: string,
  onClick: () => void,
  children?: React.Node
};

export class IconButton extends React.Component<IconButtonProps> {
  render() {
    const { message, onClick, children } = this.props;
    return (
      <button
        onClick={onClick}
        key={message}
        title={message}
        style={{
          width: "32px",
          height: "32px"
        }}
      >
        {children}
      </button>
    );
  }
}

export default hot(module)(DataResourceTransform);
