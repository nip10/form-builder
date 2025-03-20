"use client";

import type React from "react";

import { useCallback, useEffect, useMemo } from "react";
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  Panel,
  useEdgesState,
  useNodesState,
  useReactFlow,
  type Edge,
  type Node,
  type NodeTypes,
  ReactFlowProvider,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import { Button } from "@repo/ui/components/ui/button";
import { Maximize } from "lucide-react";
import FormNode from "./form-nodes/form-node";
import GroupNode from "./form-nodes/group-node";
import PageNode from "./form-nodes/page-node";
import ElementNode from "./form-nodes/element-node";
import { FormWithRelations } from "@/lib/repositories/form-repository";
import { SelectedElement, SelectedElementType } from "./form-viewer";
import { typeColors } from "./form-tree-view";

interface FormFlowViewProps {
  formData: FormWithRelations;
  selectedElement: SelectedElement | null;
  onElementSelect: (type: SelectedElementType, id: number) => void;
}

// Define custom node types
const nodeTypes: NodeTypes = {
  formNode: FormNode,
  groupNode: GroupNode,
  pageNode: PageNode,
  elementNode: ElementNode,
};

// Inner component that uses useReactFlow
function Flow({
  formData,
  selectedElement,
  onElementSelect,
  initialNodes,
  initialEdges,
}: FormFlowViewProps & { initialNodes: Node[]; initialEdges: Edge[] }) {
  const { fitView } = useReactFlow();

  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);

  // Handle node selection
  const onNodeClick = useCallback(
    (event: React.MouseEvent, node: Node) => {
      const nodeId = node.id;
      let type: "form" | "group" | "page" | "element";
      let id: string;

      if (nodeId === "form") {
        type = "form";
        id = formData.title;
      } else if (nodeId.startsWith("group-")) {
        type = "group";
        id = nodeId.replace("group-", "");
      } else if (nodeId.startsWith("page-")) {
        type = "page";
        id = nodeId.replace("page-", "");
      } else {
        type = "element";
        id = nodeId.replace("element-", "");
      }

      onElementSelect(type, Number(id));
    },
    [formData.title, onElementSelect],
  );

  // Update selected node when selectedElement changes
  useEffect(() => {
    if (!selectedElement) return;

    const newNodes = nodes.map((node) => {
      if (
        (selectedElement.type === "form" && node.id === "form") ||
        (selectedElement.type === "group" && node.id === `group-${selectedElement.id}`) ||
        (selectedElement.type === "page" && node.id === `page-${selectedElement.id}`) ||
        (selectedElement.type === "element" && node.id === `element-${selectedElement.id}`)
      ) {
        return {
          ...node,
          selected: true,
        };
      }
      return {
        ...node,
        selected: false,
      };
    });

    setNodes(newNodes);
  }, [selectedElement, nodes, setNodes]);

  // Fit view on initial render
  useEffect(() => {
    setTimeout(() => {
      fitView({ padding: 0.2 });
    }, 100);
  }, [fitView]);

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onNodeClick={onNodeClick}
      nodeTypes={nodeTypes}
      fitView
      minZoom={0.1}
      maxZoom={1.5}
      defaultViewport={{ x: 0, y: 0, zoom: 0.5 }}
    >
      <Controls showInteractive={false} />
      <Background gap={12} size={1} />
      <Panel position="top-right">
        <div className="flex gap-2">
          <Button variant="outline" size="icon" onClick={() => fitView({ padding: 0.2 })}>
            <Maximize className="h-4 w-4" />
          </Button>
        </div>
      </Panel>
    </ReactFlow>
  );
}

// Outer component that provides the ReactFlowProvider
export default function FormFlowView(props: FormFlowViewProps) {
  // Create nodes and edges from form data
  const { initialNodes, initialEdges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];

    // Add form node
    nodes.push({
      id: "form",
      type: "formNode",
      data: { label: props.formData.title || "Untitled Form", formData: props.formData },
      position: { x: 0, y: 0 },
    });

    // Add group nodes
    props.formData.groups.forEach((group, groupIndex) => {
      const groupId = `group-${group.id}`;
      nodes.push({
        id: groupId,
        type: "groupNode",
        data: { label: group.title || `Group ${groupIndex + 1}`, groupData: group },
        position: { x: 0, y: (groupIndex + 1) * 150 },
      });

      // Connect form to group
      edges.push({
        id: `form-to-${groupId}`,
        source: "form",
        target: groupId,
        animated: false,
      });

      // Add page nodes for this group
      const pagesInGroup = props.formData.groups.flatMap((group) => group.pages);
      pagesInGroup.forEach((page, pageIndex) => {
        const pageId = `page-${page.id}`;
        nodes.push({
          id: pageId,
          type: "pageNode",
          data: { label: page.title || `Page ${pageIndex + 1}`, pageData: page },
          position: { x: 250, y: groupIndex * 300 + pageIndex * 150 + 150 },
        });

        // Connect group to page
        edges.push({
          id: `${groupId}-to-${pageId}`,
          source: groupId,
          target: pageId,
          animated: false,
        });

        // Add element nodes for this page
        const elementsInPage = props.formData.groups
          .flatMap((group) => group.pages)
          .flatMap((page) => page.elements);
        elementsInPage.forEach((element, elementIndex) => {
          if (!element) return;
          const elementId = `element-${element.id}`;
          nodes.push({
            id: elementId,
            type: "elementNode",
            data: {
              label: element.label || `Element ${elementIndex + 1}`,
              elementData: element,
              elementType: element.template?.type || "unknown",
            },
            position: { x: 500, y: groupIndex * 300 + pageIndex * 150 + elementIndex * 80 + 150 },
          });

          // Connect page to element
          edges.push({
            id: `${pageId}-to-${elementId}`,
            source: pageId,
            target: elementId,
            animated: false,
          });
        });
      });
    });

    return { initialNodes: nodes, initialEdges: edges };
  }, [props.formData]);

  return (
    <div className="h-full w-full">
      <ReactFlowProvider>
        <Flow {...props} initialNodes={initialNodes} initialEdges={initialEdges} />
      </ReactFlowProvider>
    </div>
  );
}
