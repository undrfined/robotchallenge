import 'core-js/features/map';
import * as React from 'react';
import type { deepMap as deepMapType } from 'react-children-utilities';
import ReactChildrenUtilities from 'react-children-utilities';

export const reactRecursiveChildrenMap = ReactChildrenUtilities.deepMap.bind(
  ReactChildrenUtilities,
) as typeof deepMapType;

let SVG_GLOBAL_ID = 0;

export class SVGUniqueID extends React.Component {
  private svgId: number = SVG_GLOBAL_ID++;

  private lastLocalId: number = 0;

  private localIdsMap = new Map<string, number>();

  private getHookedId(originalId: string): string | null {
    if (typeof originalId === 'undefined') {
      return null;
    }

    if (!this.localIdsMap.has(originalId)) {
      this.localIdsMap.set(originalId, this.lastLocalId++);
    }

    const localId = this.localIdsMap.get(originalId);

    return `___SVG_ID__${this.svgId}__${localId}___`;
  }

  private getHookedXlinkHref(prop: string): string {
    if (typeof prop !== 'string' || !prop.startsWith('#')) {
      return prop;
    }

    const id = prop.replace('#', '');

    const fixedId = this.getHookedId(id);
    if (fixedId === null) {
      return prop;
    }

    return `#${fixedId}`;
  }

  private fixPropWithUrl(prop: string): string {
    if (typeof prop !== 'string') {
      return prop;
    }

    const [, id] = prop.match(/^url\(#(.*)\)$/) || [null, null];

    if (id === null) {
      return prop;
    }

    const fixedId = this.getHookedId(id);

    if (fixedId === null) {
      return prop;
    }

    return `url(#${fixedId})`;
  }

  render() {
    const { children } = this.props;
    return reactRecursiveChildrenMap(children, (child) => {
      // @ts-ignore
      if (!child || typeof child === 'string' || typeof child === 'number' || !('props' in child)) {
        return child;
      }

      const fixedId = this.getHookedId(child.props.id);

      const fixedProps = {
        ...child.props,
      };

      Object.keys(fixedProps).forEach((key) => {
        fixedProps[key] = this.fixPropWithUrl(fixedProps[key]);
      });

      return React.cloneElement(child, {
        ...fixedProps,
        id: fixedId,
        xlinkHref: this.getHookedXlinkHref(child.props.xlinkHref),
      });
    });
  }
}

export default SVGUniqueID;
