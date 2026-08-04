import BulletList from "@tiptap/extension-bullet-list";
import OrderedList from "@tiptap/extension-ordered-list";

export const CustomBulletList = BulletList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: "disc",
        parseHTML: (element) => {
          return (
            element.getAttribute("data-list-style-type") ||
            element.style.listStyleType ||
            "disc"
          );
        },
        renderHTML: (attributes) => {
          if (!attributes.listStyleType) {
            return {};
          }
          return {
            "data-list-style-type": attributes.listStyleType,
            style: `list-style-type: ${attributes.listStyleType}`,
          };
        },
      },
    };
  },
});

export const CustomOrderedList = OrderedList.extend({
  addAttributes() {
    return {
      ...this.parent?.(),
      listStyleType: {
        default: "decimal",
        parseHTML: (element) => {
          return (
            element.getAttribute("data-list-style-type") ||
            element.style.listStyleType ||
            element.getAttribute("type") ||
            "decimal"
          );
        },
        renderHTML: (attributes) => {
          if (!attributes.listStyleType) {
            return {};
          }
          return {
            "data-list-style-type": attributes.listStyleType,
            style: `list-style-type: ${attributes.listStyleType}`,
          };
        },
      },
    };
  },
});
