import { NodeViewWrapper, NodeViewProps, ReactNodeViewRenderer } from "@tiptap/react";
import Image from "@tiptap/extension-image";
import { useCallback, useRef, useState, useEffect } from "react";

const ResizableImageComponent = ({ node, updateAttributes, selected }: NodeViewProps) => {
  const imageRef = useRef<HTMLImageElement>(null);
  const [resizing, setResizing] = useState(false);
  const [width, setWidth] = useState(node.attrs.width || 'auto');

  const onMouseDown = useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    setResizing(true);

    const startX = e.clientX;
    const startWidth = imageRef.current?.clientWidth || 0;

    const onMouseMove = (e: MouseEvent) => {
      const currentWidth = startWidth + (e.clientX - startX);
      setWidth(currentWidth);
    };

    const onMouseUp = () => {
      setResizing(false);
      updateAttributes({ width: imageRef.current?.clientWidth });
      document.removeEventListener("mousemove", onMouseMove);
      document.removeEventListener("mouseup", onMouseUp);
    };

    document.addEventListener("mousemove", onMouseMove);
    document.addEventListener("mouseup", onMouseUp);
  }, [updateAttributes]);

  return (
    <NodeViewWrapper className="resizable-image-container relative inline-block leading-none">
      <div 
        className={`relative group inline-block transition-all duration-300 ${selected ? 'ring-2 ring-indigo-500 rounded-xl' : ''}`}
        style={{ width: width !== 'auto' ? `${width}px` : 'auto' }}
      >
        <img
          ref={imageRef}
          src={node.attrs.src}
          alt={node.attrs.alt}
          title={node.attrs.title}
          className="rounded-xl shadow-lg border border-white/5 block w-full h-auto cursor-zoom-in hover:scale-[1.01] transition-transform duration-300"
        />
        
        {/* Resize Handle */}
        <div
          onMouseDown={onMouseDown}
          className="absolute bottom-2 right-2 w-3 h-3 bg-indigo-500 rounded-full cursor-nwse-resize opacity-0 group-hover:opacity-100 transition-opacity shadow-lg border border-white/20 z-10"
        />
        
        {/* Width Indicator (Optional/Tooltip style) */}
        {resizing && (
          <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded border border-white/10">
            {Math.round(imageRef.current?.clientWidth || 0)}px
          </div>
        )}
      </div>
    </NodeViewWrapper>
  );
};

export const ResizableImage = Image.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      width: {
        default: 'auto',
        renderHTML: attributes => ({
          width: attributes.width,
        }),
      },
    };
  },

  addNodeView() {
    return ReactNodeViewRenderer(ResizableImageComponent);
  },
});
