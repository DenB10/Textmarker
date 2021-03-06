import _STORE from './../_store'

export default class _MARK {

  constructor(marker, key, preSettings) {
    let selection, defaults;

		this.marker = marker;
		selection = this.selection = marker.selection;

    defaults = {
      style: '',
      bookmark: false,
      conds: null,
      text: selection.text,
      note: ''
    };
    for (let d in defaults) {
      if (!preSettings.hasOwnProperty(d)) {
        preSettings[d] = defaults[d];
      }
    }
    preSettings.id = preSettings.id || ++marker.idcount;
		this.id = preSettings.id;
		this.simple = selection.simple;

		let range = this.range = selection.range;

		this.startOffset = range.startOffset;
		this.endOffset = range.endOffset;

		this.wrappers = null;
    this.containers = [];

		this.anchorNodePosition = null;
		this.focusNodePosition = null;

		this.keyData = {
			id: preSettings.id,
			key: key,
			style: preSettings.style,
			conds: preSettings.conds,
			text: preSettings.text,
			bookmark: preSettings.bookmark,
      note: preSettings.note
		};
  }

	create(range) {
    range = range || this.range;
    let selection = this.selection,
        style = this.keyData.style,
        nodes = selection.nodes,
        n = nodes.length,
        wrappers = this.wrappers = this.wrappers || this.createWrappers(style, n),
        i = 0,
        lastIndex = n - 1,
        node;

    for (; i < n; i++) {
      node = nodes[i];
      range.selectNodeContents(node);
      if (!i) range.setStart(node, this.startOffset);

      if (i === lastIndex)
        range.setEnd(node, this.endOffset);

      range.surroundContents(wrappers[i]);
      this.containers.push(wrappers[i].parentNode);

      node.parentNode.normalize();
    }

    this.definePosition(lastIndex);

    if (this.keyData.bookmark)
      this.marker.setBookmark(this);

    if (!this.keyData.conds)
      this.describe();

		//NODES_CACHE.pop();

		return this;
	}
  definePosition(n, includingOffsets) {
    let wrappers = this.wrappers;
    n = typeof n === 'number' ? n : wrappers.length - 1;
    let firstWrapper = wrappers[0],
        lastWrapper = wrappers[n];

    this.anchorNodePosition = this.whichChild(firstWrapper.parentNode, firstWrapper, true) - 1;
    this.focusNodePosition = this.whichChild(lastWrapper.parentNode, lastWrapper, true);

    if (!lastWrapper.previousSibling || lastWrapper.previousSibling.nodeType === 3) this.focusNodePosition -= 1;

    if (this.anchorNodePosition < 0) this.anchorNodePosition = 0;
    if (this.focusNodePosition < 0) this.focusNodePosition = 0;

    if (includingOffsets) {
      this.startOffset = firstWrapper.previousSibling && firstWrapper.previousSibling.data ? firstWrapper.previousSibling.data.length : 0;
      this.endOffset = this.simple ? this.startOffset + this.keyData.text.length : this.endOffset;
    }
    return this;
  }
  resume() {
    this.definePosition(undefined, true)
        .describe();

    return this;
  }
	undo() {
		let containers = this.containers,
				wrappers = this.wrappers,
				w = wrappers.length,
				container, wrapper;

		while (w--) {
			container = containers[w];
			wrapper = wrappers[w];
			container.replaceChild(wrapper.firstChild, wrapper);
			container.normalize();
		}
		return this;
	}
	redo() {
    let containers = this.containers,
        selection = this.selection.self,
        range = this.range;

    range.setStart(containers[0].childNodes[this.anchorNodePosition], this.startOffset);
    range.setEnd(containers[containers.length - 1].childNodes[this.focusNodePosition], this.endOffset);

    selection.removeAllRanges();
    selection.addRange(range);

    this.selection.collectNodes();
    selection.collapseToStart();

    return this.create();
	}
	whichChild(parent, child, includingTextNodes) {
		if (!parent || !child) { return null; }
		let children = includingTextNodes || child.nodeType === 3 ? parent.childNodes : parent.children,
				c = children.length,
				i = 0;

    for ( ; i < c; i++)
      if (children[i] === child) return i;
	}
	createWrappers(style, number) {
		let wrappers = [],
        hasNote = this.keyData.note,
        i = 0,
        wrapper;

		for ( ; i < number; i++) {
			wrapper = window.document.createElement('tm');
      wrapper.classList.add('textmarker-highlight');
			wrapper.setAttribute('style', style);
			wrapper.setAttribute('data-tm-id', this.id + '_' + i);
      if (hasNote) wrapper.setAttribute('title', browser.i18n.getMessage('toggle_note'));
      //wrapper.setAttribute('contextmenu', 'textmarker-ctm');
			wrappers.push(wrapper);
		}
		return wrappers;
	}
  describe() {
    if (_STORE.pdf) return this._describe_PDF();

    this._describe();
  }
  _describe() {
		let range = this.range,
      selection = this.selection,
			start = range.startContainer,
			end = range.endContainer,
			singleNode = this.simple,
			//parent = this.containers ? this.containers[0] : start.parentNode,
      parent = this.wrappers[0].parentNode,
			grampa = parent.parentNode,
      grandgrampa = grampa.parentNode || 0,
			fTNP = this.anchorNodePosition;

		this.keyData.conds = {
			o: this.startOffset,
			n1: parent.nodeName,
			p1: fTNP,
			n2: grampa.nodeName,
			p2: this.whichChild(grampa, parent),
			p3: grandgrampa ? this.whichChild(grandgrampa, grampa) : undefined,
			p4: grandgrampa && grandgrampa.parentNode ? this.whichChild(grandgrampa.parentNode, grandgrampa) : undefined
		};
    return this.keyData.conds;
	}
	_describe_PDF() {
		let M = this,
        rg = this.range,
				start = this.wrappers[0],
				end = this.wrappers[this.wrappers.length - 1],
				singleNode = this.simple,
				extremes = singleNode ? [start] : [start, end],
        startOffset = this.startOffset,
				endOffset = this.endOffset,
				nodes = [this.anchorNodePosition, this.focusNodePosition],
				offsets = [startOffset, endOffset],
				containers = [],
				pages = [],
				parent, className, isText;

		extremes.forEach(function(node, i) {
			parent = node.parentNode;

			if (parent.nodeName === 'TM')
				containers[i] = parent.getAttribute('data-tm-id');
			else {
        parent = parent.parentNode;
  			node = node.parentNode;
        containers[i] = M.whichChild(parent, node, 'DIV');
			}

			while (pages[i] === undefined && parent.parentNode) {
				if ((className = parent.className) && className === 'page')
					pages[i] = parent.getAttribute('data-page-number') * 1;
				else
					parent = parent.parentNode;
			}
			if (pages[i] === undefined)
				pages[i] = containers[i] = offsets[i] = i * -1;

			if (containers[i] === undefined)
				containers[i] = i * -1;

			pages[i] = pages[i] || 1;
		});

		this.keyData.conds = {
			pageIntersection: !singleNode && pages[0] !== pages[1],
			offsets: offsets,
			containers: containers,
			nodes: nodes,
			pages: pages
		};

    return this.keyData.conds;
	}
}
