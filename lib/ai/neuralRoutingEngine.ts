
/**
 * =========================================================
 * NEURAL ROUTING ENGINE (OSRM REPLACEMENT)
 * =========================================================
 * - Learned cost function instead of static routing weights
 * - Traffic + time-aware adaptive routing
 * - Graph search over neural edge weights
 * - Online feedback correction loop
 * =========================================================
 */

/**
 * =========================
 * TYPES
 * =========================
 */

export type RoadNode = {
  id: string;
  lat: number;
  lng: number;
};

export type RoadEdge = {
  from: string;
  to: string;

  distance: number;
  traffic: number;
  historicalTime: number;
};

export type RouteResult = {
  path: string[];
  cost: number;
  distance: number;
};

/**
 * =========================
 * LEARNED ROUTING PARAMETERS
 * (this is your "neural weight vector")
 * =========================
 */

type RoutingWeights = {
  distanceW: number;
  trafficW: number;
  timeW: number;
};

const defaultWeights: RoutingWeights = {
  distanceW: 0.4,
  trafficW: 0.4,
  timeW: 0.2,
};

/**
 * =========================
 * GRAPH STRUCTURE
 * =========================
 */

export class RoadGraph {
  nodes = new Map<string, RoadNode>();
  edges = new Map<string, RoadEdge[]>();

  addNode(node: RoadNode) {
    this.nodes.set(node.id, node);
  }

  addEdge(edge: RoadEdge) {
    if (!this.edges.has(edge.from)) {
      this.edges.set(edge.from, []);
    }

    this.edges.get(edge.from)!.push(edge);
  }

  getNeighbors(nodeId: string) {
    return this.edges.get(nodeId) || [];
  }
}

/**
 * =========================
 * NEURAL COST FUNCTION
 * =========================
 * This replaces OSRM cost function
 */

function neuralCost(
  edge: RoadEdge,
  w: RoutingWeights
) {
  return (
    edge.distance * w.distanceW +
    edge.traffic * w.trafficW +
    edge.historicalTime * w.timeW
  );
}

/**
 * =========================
 * SOFT TRAFFIC ADAPTATION (TRANSFORMER-LIKE CONTEXT SHIFT)
 * =========================
 */

function adaptTrafficContext(edges: RoadEdge[]) {
  const avgTraffic =
    edges.reduce((a, e) => a + e.traffic, 0) /
    Math.max(edges.length, 1);

  return edges.map(e => ({
    ...e,
    traffic: e.traffic * (1 + avgTraffic * 0.01),
  }));
}

/**
 * =========================
 * A* SEARCH OVER NEURAL COST SPACE
 * =========================
 */

export class NeuralRoutingEngine {
  constructor(private graph: RoadGraph) {}

  private heuristic(a: string, b: string) {
    const A = this.graph.nodes.get(a);
    const B = this.graph.nodes.get(b);

    if (!A || !B) return 0;

    return Math.hypot(
      A.lat - B.lat,
      A.lng - B.lng
    );
  }

  findRoute(
    start: string,
    end: string,
    weights: RoutingWeights = defaultWeights
  ): RouteResult {
    const openSet = new Set<string>([start]);

    const cameFrom = new Map<string, string>();
    const gScore = new Map<string, number>();
    const fScore = new Map<string, number>();

    gScore.set(start, 0);
    fScore.set(start, 0);

    while (openSet.size > 0) {
      const current = [...openSet].reduce(
        (a, b) =>
          (fScore.get(a) || Infinity) <
          (fScore.get(b) || Infinity)
            ? a
            : b
      );

      openSet.delete(current);

      if (current === end) {
        return this.reconstruct(
          cameFrom,
          current,
          gScore.get(current) || 0
        );
      }

      const neighbors = adaptTrafficContext(
        this.graph.getNeighbors(current)
      );

      for (const edge of neighbors) {
        const cost = neuralCost(edge, weights);

        const tentative =
          (gScore.get(current) || 0) + cost;

        if (
          tentative <
          (gScore.get(edge.to) || Infinity)
        ) {
          cameFrom.set(edge.to, current);
          gScore.set(edge.to, tentative);

          const heuristic =
            this.heuristic(edge.to, end);

          fScore.set(
            edge.to,
            tentative + heuristic
          );

          openSet.add(edge.to);
        }
      }
    }

    return {
      path: [],
      cost: Infinity,
      distance: Infinity,
    };
  }

  /**
   * =========================
   * PATH RECONSTRUCTION
   * =========================
   */

  private reconstruct(
    cameFrom: Map<string, string>,
    current: string,
    cost: number
  ): RouteResult {
    const path = [current];

    while (cameFrom.has(current)) {
      current = cameFrom.get(current)!;
      path.unshift(current);
    }

    return {
      path,
      cost,
      distance: path.length,
    };
  }
}

/**
 * =========================
 * ONLINE LEARNING LOOP (FEEDBACK ADJUSTMENT)
 * =========================
 */

export function updateRoutingWeights(
  weights: RoutingWeights,
  actualTime: number,
  predictedTime: number
): RoutingWeights {
  const error = actualTime - predictedTime;

  return {
    distanceW:
      weights.distanceW +
      error * 0.001,

    trafficW:
      weights.trafficW +
      error * 0.002,

    timeW:
      weights.timeW +
      error * 0.003,
  };
}

/**
 * =========================
 * ROUTING SINGLE ENTRY FUNCTION
 * =========================
 */

export function route(
  graph: RoadGraph,
  start: string,
  end: string,
  weights?: RoutingWeights
): RouteResult {
  const engine = new NeuralRoutingEngine(graph);

  return engine.findRoute(
    start,
    end,
    weights || defaultWeights
  );
}