$.widget("custom.statusBoard", {

    /**************************************************************
     ****** default options
     *************************************************************/
    options: {
        swimlanes: [],
        columns: [],
        boardItemSize: "large",
        boardItems: [],
        boardItemEdit: null,
        boardItemView: null,
        boardItemSort: function(boardItemA, boardItemB) {
            return boardItemA.content.label.localeCompare(boardItemB.content.label);
        }
    },
    /**************************************************************
     ****** global variables
     *************************************************************/
    global: {
        boardItemHoverContainer: $("<div style='position:absolute'>"),
        createBoardItemFunction: function() {
            var errMsg = "error: function createBoardItem is not defined";
            throw (errMsg);
        },
        hasSwimlanes: true,
        boardItems: {},
        loadIndicator: $("<div>"),
        itemCellDialog: {
            dialog: $("<div class='boardItem_dialog'>"),			
			header: $("<div class='ui-widget ui-widget-header boardItem_dialog_header'>"),
            content: $("<div class='ui-widget ui-widget-content boardItem_dialog_content'>"),
			position: null
        }
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _setOption: function(key, value) {
        this._super(key, value);
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _setOptions: function(options) {
        this._super(options);
        this.refresh();
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _cloneXYItem: function(xyItem, type) {
        var data = {};
        data.id = xyItem.id;
        data.type = type;
        data.label = xyItem.label;
        data.collapsed = xyItem.collapsed;
        return data;
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _addLoadIndicator: function() {
        this.element.append(this.global.loadIndicator);
        this.global.loadIndicator.addClass("ui-widget-overlay");
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _showLoadIndicator: function() {
        this.global.loadIndicator.show();
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _hideLoadIndicator: function() {
        this.global.loadIndicator.hide();
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _create: function() {

        try {
            this._intializeOptions();
            this._addLoadIndicator();
            this._initializeBoardItems();
            this._initializeBoard();
            this._createBoardTable();
        } finally {
            this.global.loadIndicator.hide();
        }
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _createClickableFunction: function(clickableObject, defaultFunction) {

        if (null == clickableObject) {
            clickableObject = {};
        }

        if (null == clickableObject.funcOrUrl) {
            clickableObject.funcOrUrl = defaultFunction;
        }

        if (null == clickableObject.funcOrUrl) {
            return clickableObject;
        }

        if ("function" == typeof(clickableObject.funcOrUrl)) {
            return clickableObject;
        }

        if ("string" != typeof(clickableObject.funcOrUrl)) {
            return clickableObject;
        }

        if (0 == clickableObject.funcOrUrl.length) {
            clickableObject.funcOrUrl = null;
            return clickableObject;
        }

        if (0 == clickableObject.funcOrUrl.indexOf("http://")) {
            var url = clickableObject.funcOrUrl;
            clickableObject.funcOrUrl = function() {
                window.location = url;
            }
            return clickableObject;
        }

        try {
            clickableObject.funcOrUrl = new Function(clickableObject.funcOrUrl);
            return clickableObject;
        } catch (err) {
            var errMsg = "error: is not a valid function: " + clickableObject.funcOrUrl;
            console.log(errMsg);
            throw (errMsg);
        }
    },

    /**************************************************************************
     ******
     *************************************************************************/
	_position: function(rootContainer, container, defaultPosition) {
		
		if(null != defaultPosition && this._isElementOnScreen(container)) {
			
				container.position(defaultPosition);
		} else {
			
			var position = rootContainer.offset();
			
			var topPos = position.top - container.height() / 2 + rootContainer.height() / 2;
			var leftPos = position.left - container.width() / 2 + rootContainer.width() / 2;
			
			container.css("top", topPos);
			container.css("left", leftPos < 0 ? 5 : leftPos);		
		}
	}, 
	
    /**************************************************************************
     ******
     *************************************************************************/
	_isElementOnScreen: function(element) {
		
		var win = $(window);
		
		var viewport = {
			top : win.scrollTop(),
			left : win.scrollLeft()
		};
		
		viewport.right = viewport.left + win.width();
		viewport.bottom = viewport.top + win.height();
		
		var bounds = element.offset();
		bounds.right = bounds.left + element.outerWidth();
		bounds.bottom = bounds.top + element.outerHeight();
		
		return (!(viewport.right < bounds.left && viewport.left > bounds.right && viewport.bottom < bounds.top && viewport.top > bounds.bottom));		
	},
	
    /**************************************************************************
     ******
     *************************************************************************/
    _addBoardItemsToTableCell: function(boardItems, col, swim, boardTableCell) {

        var self = this;

        if(null == boardTableCell) {
            // get the table cell
            boardTableCell = this.element.find('.board_cell[col="' + col + '"][swim="' + swim + '"]');
        }

        if(boardTableCell.hasClass("collapsed")) {

			// remove count display
            boardTableCell.text("");
			
            if (0 == boardItems.length) {
                return boardTableCell;
            }
			
            // add click handler, if the cell contains items
            boardTableCell.addClass("clickable");
            boardTableCell.click(function(boardItems) {
                return function showBoardItemContainerDialog() {
					
					self.global.itemCellDialog.dialog.zIndex($(this).zIndex() + 10);
                    self._addBoardItemsToTableCell(boardItems, null, null, self.global.itemCellDialog.content);
					self._position(boardTableCell, self.global.itemCellDialog.dialog, self.global.itemCellDialog.position);							
					self.global.itemCellDialog.dialog.fadeIn();
                }
            }(boardItems));

			// set count display
            boardTableCell.text("#" + boardItems.length);

        } else {
            boardTableCell.children().remove();

            ///////////////////////////////////////////////////////////
            // iterate over the associated board items
            ///////////////////////////////////////////////////////////
            var sortedBoardItems = boardItems.sort(this.options.boardItemSort);
            for (var b in sortedBoardItems) {
                var boardItemData = sortedBoardItems[b];
                var boardItem = this.global.createBoardItemFunction(boardItemData, this);
                boardTableCell.append(boardItem);
            }
        }

        return boardTableCell;
    },


    /**************************************************************************
     ******
     *************************************************************************/
    _initializeBoard: function() {

        var self = this;

        ///////////////////////////////////////////////////////////
        // add item cell dialog
        ///////////////////////////////////////////////////////////
        this.element.append(this.global.itemCellDialog.dialog);
        this.global.itemCellDialog.dialog.append(this.global.itemCellDialog.header);
        this.global.itemCellDialog.dialog.append(this.global.itemCellDialog.content);
        this.global.itemCellDialog.dialog.draggable({
            cursor: "move",
            stop: function(event, ui) {
                self.global.itemCellDialog.position = ui.position;
            }
        });
        this.global.itemCellDialog.dialog.mouseleave(function() {
            $(this).fadeOut();
        });


        ///////////////////////////////////////////////////////////
        // add board item hover container to the parent container
        ///////////////////////////////////////////////////////////
        this.element.append(this.global.boardItemHoverContainer);
        this.global.boardItemHoverContainer.mouseleave(function() {
            $(this).fadeOut();
        });

    },

    /**************************************************************************
     ******
     *************************************************************************/
    _createBoard: function() {

        var self = this;
        this.element.addClass("board_table_parent");

        ///////////////////////////////////////////////////////////
        // add the status board 
        ///////////////////////////////////////////////////////////
        var boardTable = $("<div>");
        this.element.append(boardTable);
        boardTable.addClass("board_table");
        boardTable.addClass("ui-helper-reset");

        ///////////////////////////////////////////////////////////
        // add the header row 
        ///////////////////////////////////////////////////////////
        var boardTableHeader = $("<div>");
        boardTable.append(boardTableHeader);
        boardTableHeader.addClass("board_row");

        ///////////////////////////////////////////////////////////
        // add header columns
        ///////////////////////////////////////////////////////////	

        // add first header column (needed for swimlanes)
        var boardTableHeaderCell = $("<div>");
        boardTableHeader.append(boardTableHeaderCell);
        boardTableHeaderCell.addClass("board_cell");
        boardTableHeaderCell.addClass("empty");

        // iterate header columns
        for (var c in this.options.columns) {
            var column = this.options.columns[c];

            // add border header column
            var boardTableHeaderCellBorder = $("<div>");
            boardTableHeader.append(boardTableHeaderCellBorder);
            boardTableHeaderCellBorder.addClass("board_cell");
            boardTableHeaderCellBorder.addClass("border");

            // add header column
            var boardTableHeaderCell = $("<div>");
            boardTableHeader.append(boardTableHeaderCell);
            boardTableHeaderCell.attr("col", column.id);
            boardTableHeaderCell.attr("swim", "");
            boardTableHeaderCell.addClass("board_head");
            boardTableHeaderCell.addClass("clickable");
            boardTableHeaderCell.addClass("ui-widget ui-widget-header ui-corner-all ui-state-active");

            // add header collapse function
            boardTableHeaderCell.click(function(column) {
                return function clickColumnHeader() {
                    column.collapsed = !column.collapsed;
                    var data = self._cloneXYItem(column, "column");
                    self._trigger("setCollapsedStatus", null, data);
                    self._create();
                }
            }(column));

            // add header icon
            var boardTableHeaderIcon = $("<div>");
            boardTableHeaderCell.append(boardTableHeaderIcon);
            boardTableHeaderIcon.addClass("ui-icon ui-icon-minus");

            // add header text
            var boardTableHeaderText = $("<span>");
            boardTableHeaderCell.append(boardTableHeaderText);
            boardTableHeaderText.text(column.label);
        }

        ///////////////////////////////////////////////////////////
        // add swimlanes
        ///////////////////////////////////////////////////////////	
        for (var s in this.options.swimlanes) {
            var swimlane = this.options.swimlanes[s];

            // add border row
            var boardBorderRow = $("<div>");
            boardTable.append(boardBorderRow);
            boardBorderRow.addClass("board_row");
            boardBorderRow.addClass("border");

            // add table row (swimlane row)
            var boardSwimlaneRow = $("<div>");
            boardTable.append(boardSwimlaneRow);
            boardSwimlaneRow.addClass("board_row");

            // add swimlane header
            var boardSwimlaneHeader = $("<div>");
            boardSwimlaneRow.append(boardSwimlaneHeader);
            boardSwimlaneHeader.attr("col", "");
            boardSwimlaneHeader.attr("swim", swimlane.id);
            boardSwimlaneHeader.addClass("board_head");
            boardSwimlaneHeader.addClass("clickable");
            boardSwimlaneHeader.addClass("ui-widget ui-widget-header ui-corner-all ui-state-active");

            // add swimlane header function
            boardSwimlaneHeader.click(function(swimlane) {
                return function clickSwimlaneHeader() {
                    swimlane.collapsed = !swimlane.collapsed;
                    var data = self._cloneXYItem(swimlane, "swimlane");
                    self._trigger("setCollapsedStatus", null, data);
                    self._create();
                }
            }(swimlane));

            // add swimlane header icon
            var boardSwimlaneHeaderIcon = $("<div>");
            boardSwimlaneHeader.append(boardSwimlaneHeaderIcon);
            boardSwimlaneHeaderIcon.addClass("ui-icon ui-icon-minus");

            // add swimlane header text
            var boardSwimlaneHeaderText = $("<span>");
            boardSwimlaneHeader.append(boardSwimlaneHeaderText);
            boardSwimlaneHeaderText.text(swimlane.label);

            ///////////////////////////////////////////////////////////
            // add cells
            ///////////////////////////////////////////////////////////	
            for (var c in this.options.columns) {
                var column = this.options.columns[c];

                // add column border 
                var boardSwimlaneCellBorder = $("<div>");
                boardSwimlaneRow.append(boardSwimlaneCellBorder);
                boardSwimlaneCellBorder.addClass("board_cell");
                boardSwimlaneCellBorder.addClass("border");

                // add column cell
                var boardCell = $("<div>");
                boardSwimlaneRow.append(boardCell);
                boardCell.attr("col", column.id);
                boardCell.attr("swim", swimlane.id);
                boardCell.addClass("board_cell");
                boardCell.addClass("ui-widget ui-corner-all ui-state-focus content");

                // add column and swimlane data to each cell
                boardCell.data("cell.Column.Data", column);
                boardCell.data("cell.Swimlane.Data", swimlane);
            }
        }

        ///////////////////////////////////////////////////////////
        // check column collapse
        ///////////////////////////////////////////////////////////
        for (var c in this.options.columns) {
            var column = this.options.columns[c];

            var boardTableHeader = boardTable.find('div.board_head[col="' + column.id + '"][swim=""]');
            var boardTableCell = boardTable.find('div.board_cell[col="' + column.id + '"]');

            if (column.collapsed) {
                boardTableHeader.removeClass("ui-state-active");
                boardTableHeader.addClass("rowspanned ui-state-focus");
                boardTableCell.addClass("empty");
            } else {
                boardTableHeader.removeClass("rowspanned ui-state-focus");
                boardTableHeader.addClass("ui-state-active");
                boardTableCell.removeClass("empty");
            }
        }

        ///////////////////////////////////////////////////////////
        // check swimlane collapse
        ///////////////////////////////////////////////////////////
        for (var s in this.options.swimlanes) {
            var swimlane = this.options.swimlanes[s];

            var boardSwimlaneHeader = boardTable.find('div.board_head[col=""][swim="' + swimlane.id + '"]');
            var boardSwimlaneCell = boardTable.find('div.board_cell[swim="' + swimlane.id + '"]');

            if (swimlane.collapsed) {
                //boardSwimlaneHeader.removeClass("ui-state-active");
                //boardSwimlaneHeader.addClass("ui-state-focus");
                boardSwimlaneCell.addClass("collapsed");
                boardSwimlaneCell.removeClass("content");

            } else {
                //boardSwimlaneHeader.removeClass("ui-state-focus");
                //boardSwimlaneHeader.addClass("ui-state-active");
                boardSwimlaneCell.removeClass("collapsed");
                boardSwimlaneCell.addClass("content");
            }
        }

        ///////////////////////////////////////////////////////////
        // add board items
        ///////////////////////////////////////////////////////////		
        // iterate columns
        for (var c in this.options.columns) {
            var column = this.options.columns[c];

            // ...and read next column if not collapsed
            if (column.collapsed) continue;

            // iterate swimlanes
            for (var s in this.options.swimlanes) {
                var swimlane = this.options.swimlanes[s];

                // get all board items, associated to the the column and the swimlane
                var boardItems = this.global.boardItems[swimlane.id][column.id];

                // finally add all items to the cell
                var boardTableCell = this._addBoardItemsToTableCell(boardItems, column.id, swimlane.id);
            }
        }

        ///////////////////////////////////////////////////////////
        // add droppable for each board item cell
        ///////////////////////////////////////////////////////////		
        $(".board_cell:not(.border, .empty)").droppable({
            activeClass: "ui-state-highlight",
            hoverClass: "drop-hover",
            tolerance: "pointer",

            ///////////////////////////////////////////////////////////
            // only accept the draggable, if target and source is different
            ///////////////////////////////////////////////////////////		
            accept: function(boardItem) {
                var boardTableCell = this;
                var boardItemData = boardItem.data("boardItem.Data");

                // ????? dont know why this can happen
                if (null == boardItemData) {
                    return false;
                }

                // get coordinates
                var sourceCol = boardItemData.column;
                var sourceSwim = boardItemData.swimlane;
                var targetCol = boardTableCell.getAttribute("col");
                var targetSwim = boardTableCell.getAttribute("swim");

                // check if source and target is equal
                if (sourceCol == targetCol && sourceSwim == targetSwim) {
                    return false;
                }

                // do not accept drag for collapsed cells
                //if ($(boardTableCell).hasClass("collapsed")) {
                //    return false;
                //}                

                // source and target is different
                return true;
            },

            ///////////////////////////////////////////////////////////
            // drop a boardItem to an accepted cell
            ///////////////////////////////////////////////////////////		
            drop: function (event, ui) {
                var boardItem = ui.draggable;
                var boardTableCell = this;

                var boardItemData = boardItem.data("boardItem.Data");

                // get coordinates
                var sourceCol = boardItemData.column;
                var sourceSwim = boardItemData.swimlane;
                var sourceBoardTableCell = self.element.find('div.board_cell[col="' + sourceCol + '"][swim="' + sourceSwim + '"]');

                var targetCol = boardTableCell.getAttribute("col");
                var targetSwim = boardTableCell.getAttribute("swim");

                var source = {}
                source.column = sourceBoardTableCell.data("cell.Column.Data");
                source.swimlane = sourceBoardTableCell.data("cell.Swimlane.Data");

                var target = {};
                target.column = $(boardTableCell).data("cell.Column.Data");
                target.swimlane = $(boardTableCell).data("cell.Swimlane.Data");

                var data = {};
                data.source = source;
                data.target = target;
                data.boardItem = boardItemData;

                // call external drop handlers
                try {
                    self._showLoadIndicator();

                    if (null != self.options.drop) {
                        self.options.drop(event, data);
                        succeedHandler();
                    } else if (null != self.options.dropAsync) {
                        self.options.dropAsync(event, data, succeedHandler, errorHandler);
                    }
                } catch (err) {
                    self._hideLoadIndicator();
                    event.stopImmediatePropagation();
                    return;
                }

                // if an error occurs after dropping the error handler is called
                function errorHandler(message) {
                    self._hideLoadIndicator();
                    alert(message);
                }

                // after visual dropping (moving) the boardItem in the gui, move the boardItem in the model and refresh
                // the gui
                function succeedHandler() {
                    self._hideLoadIndicator();

                    boardItemData.column = targetCol;
                    boardItemData.swimlane = targetSwim;

                    // refresh and add items to target cell
                    var targetBoardItems = self.global.boardItems[targetSwim][targetCol];
                    targetBoardItems.push(boardItemData);
                    self._addBoardItemsToTableCell(targetBoardItems, targetCol, targetSwim);

                    // refresh and remove from source cell
                    var sourceBoardItems = self.global.boardItems[sourceSwim][sourceCol];
                    sourceBoardItems = sourceBoardItems.filter(function(current) {
                        return !(current.id == boardItemData.id);
                    })
					
                    self.global.boardItems[sourceSwim][sourceCol] = sourceBoardItems;
                    self._addBoardItemsToTableCell(sourceBoardItems, sourceCol, sourceSwim);

                    //finally remove hover container, if the container was used
                    self.global.boardItemHoverContainer.children().remove();
                }
            }
        });
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _createBoardTable: function() {

        var self = this;
        this.element.addClass("board_table_parent");

        ///////////////////////////////////////////////////////////
        // add the status board
        ///////////////////////////////////////////////////////////
        var boardTable = $("<table>");
        this.element.append(boardTable);
        boardTable.addClass("board_table");

        ///////////////////////////////////////////////////////////
        // add the header row
        ///////////////////////////////////////////////////////////
        var boardTableHeader = $("<tr>");
        boardTable.append(boardTableHeader);

        ///////////////////////////////////////////////////////////
        // add header columns
        ///////////////////////////////////////////////////////////

        // add first header column (needed for swimlanes)
        var boardTableHeaderCell = $("<th>");
        boardTableHeader.append(boardTableHeaderCell);
        boardTableHeaderCell.addClass("board_cell");
        boardTableHeaderCell.addClass("empty");

        // iterate header columns
        for (var c in this.options.columns) {
            var column = this.options.columns[c];

            // add header column
            var boardTableHeaderCell = $("<th>");
            boardTableHeader.append(boardTableHeaderCell);
            boardTableHeaderCell.attr("col", column.id);
            boardTableHeaderCell.attr("swim", "");
            boardTableHeaderCell.addClass("board_head");
            boardTableHeaderCell.addClass("clickable");
            //boardTableHeaderCell.addClass("ui-widget ui-widget-header ui-corner-all ui-state-active");

            // add header collapse function
            boardTableHeaderCell.click(function(column) {
                return function clickColumnHeader() {
                    column.collapsed = !column.collapsed;
                    var data = self._cloneXYItem(column, "column");
                    self._trigger("setCollapsedStatus", null, data);
                    self._create();
                }
            }(column));

            // add header text
            var boardTableHeaderText = $("<div>");
            boardTableHeaderText.addClass("ui-widget ui-widget-header ui-corner-all ui-state-active");
            boardTableHeaderCell.append(boardTableHeaderText);			
			$("<span>").appendTo(boardTableHeaderText).text(column.label);
			
			// count board items for current column
			var boardItemCountforColumn = 0;
			for (var s in this.options.swimlanes) {
			var swimlane = this.options.swimlanes[s];
				boardItemCountforColumn += this.global.boardItems[swimlane.id][column.id].length;
			}

			$("<span>").appendTo(boardTableHeaderText).text(" (#" + boardItemCountforColumn + ")");
        }

        ///////////////////////////////////////////////////////////
        // add swimlanes
        ///////////////////////////////////////////////////////////
        for (var s in this.options.swimlanes) {
            var swimlane = this.options.swimlanes[s];

            // add table row (swimlane row)
            var boardSwimlaneRow = $("<tr>");
            boardTable.append(boardSwimlaneRow);
            boardSwimlaneRow.addClass("board_row");

            // add swimlane header
            var boardSwimlaneHeader = $("<th>");
            boardSwimlaneRow.append(boardSwimlaneHeader);
            boardSwimlaneHeader.attr("col", "");
            boardSwimlaneHeader.attr("swim", swimlane.id);
            boardSwimlaneHeader.addClass("board_head");
            boardSwimlaneHeader.addClass("clickable");
            //boardSwimlaneHeader.addClass("ui-widget ui-widget-header ui-corner-all ui-state-active");

            // add swimlane header function
            boardSwimlaneHeader.click(function(swimlane) {
                return function clickSwimlaneHeader() {
                    swimlane.collapsed = !swimlane.collapsed;
                    var data = self._cloneXYItem(swimlane, "swimlane");
                    self._trigger("setCollapsedStatus", null, data);
                    self._create();
                }
            }(swimlane));
			
            // add swimlane header text
            var boardSwimlaneHeaderText = $("<div>");
            boardSwimlaneHeaderText.addClass("ui-widget ui-widget-header ui-corner-all ui-state-active");
            boardSwimlaneHeader.append(boardSwimlaneHeaderText);
			$("<span>").appendTo(boardSwimlaneHeaderText).text(swimlane.label);
			
			// count board items for current column
			var boardItemCountforSwimlane = 0;
			for (var c in this.options.columns) {
			var column = this.options.columns[c];
				boardItemCountforSwimlane += this.global.boardItems[swimlane.id][column.id].length;
			}

			$("<span>").appendTo(boardSwimlaneHeaderText).text(" (#" + boardItemCountforSwimlane + ")");

            ///////////////////////////////////////////////////////////
            // add cells
            ///////////////////////////////////////////////////////////
            for (var c in this.options.columns) {
                var column = this.options.columns[c];

                // add column cell
                var boardCell = $("<td>");
                boardSwimlaneRow.append(boardCell);
                boardCell.attr("col", column.id);
                boardCell.attr("swim", swimlane.id);
                boardCell.addClass("board_cell");
                //boardCell.addClass("ui-widget ui-corner-all ui-state-focus content");

                // add column and swimlane data to each cell
                boardCell.data("cell.Column.Data", column);
                boardCell.data("cell.Swimlane.Data", swimlane);
            }
        }

        ///////////////////////////////////////////////////////////
        // check column collapse
        ///////////////////////////////////////////////////////////
        for (var c in this.options.columns) {
            var column = this.options.columns[c];

            var boardTableHeader = boardTable.find('.board_head[col="' + column.id + '"][swim=""]');
            var boardTableCell = boardTable.find('.board_cell[col="' + column.id + '"]');

            if (column.collapsed) {
                boardTableHeader.attr("rowspan", this.options.swimlanes.length + 1);
				boardTableHeader.addClass("collapsed");
				boardTableCell.remove();				
            }
        }

        ///////////////////////////////////////////////////////////
        // check swimlane collapse
        ///////////////////////////////////////////////////////////
        for (var s in this.options.swimlanes) {
            var swimlane = this.options.swimlanes[s];

            var boardSwimlaneHeader = boardTable.find('.board_head[col=""][swim="' + swimlane.id + '"]');
            var boardSwimlaneCell = boardTable.find('.board_cell[swim="' + swimlane.id + '"]');

            if (swimlane.collapsed) {
                boardSwimlaneCell.addClass("collapsed");
                boardSwimlaneCell.removeClass("content");

            } else {
                boardSwimlaneCell.removeClass("collapsed");
                boardSwimlaneCell.addClass("content");
            }
        }

        ///////////////////////////////////////////////////////////
        // add board items
        ///////////////////////////////////////////////////////////
        // iterate columns
        for (var c in this.options.columns) {
            var column = this.options.columns[c];

            // ...and read next column if not collapsed
            if (column.collapsed) continue;

            // iterate swimlanes
            for (var s in this.options.swimlanes) {
                var swimlane = this.options.swimlanes[s];

                // get all board items, associated to the the column and the swimlane
                var boardItems = this.global.boardItems[swimlane.id][column.id];

                // finally add all items to the cell
                var boardTableCell = this._addBoardItemsToTableCell(boardItems, column.id, swimlane.id);
            }
        }

        ///////////////////////////////////////////////////////////
        // add droppable for each board item cell
        ///////////////////////////////////////////////////////////
        $(".board_cell:not(.border, .empty)").droppable({
            activeClass: "ui-state-highlight",
            hoverClass: "drop-hover",
            tolerance: "pointer",

            ///////////////////////////////////////////////////////////
            // only accept the draggable, if target and source is different
            ///////////////////////////////////////////////////////////
            accept: function(boardItem) {
                var boardTableCell = this;
                var boardItemData = boardItem.data("boardItem.Data");

                // ????? dont know why this can happen
                if (null == boardItemData) {
                    return false;
                }

                // get coordinates
                var sourceCol = boardItemData.column;
                var sourceSwim = boardItemData.swimlane;
                var targetCol = boardTableCell.getAttribute("col");
                var targetSwim = boardTableCell.getAttribute("swim");

                // check if source and target is equal
                if (sourceCol == targetCol && sourceSwim == targetSwim) {
                    return false;
                }

                // do not accept drag for collapsed cells
                //if ($(boardTableCell).hasClass("collapsed")) {
                //    return false;
                //}

                // source and target is different
                return true;
            },

            ///////////////////////////////////////////////////////////
            // drop a boardItem to an accepted cell
            ///////////////////////////////////////////////////////////
            drop: function (event, ui) {
                var boardItem = ui.draggable;
                var boardTableCell = this;

                var boardItemData = boardItem.data("boardItem.Data");

                // get coordinates
                var sourceCol = boardItemData.column;
                var sourceSwim = boardItemData.swimlane;
                var sourceBoardTableCell = self.element.find('div.board_cell[col="' + sourceCol + '"][swim="' + sourceSwim + '"]');

                var targetCol = boardTableCell.getAttribute("col");
                var targetSwim = boardTableCell.getAttribute("swim");

                var source = {}
                source.column = sourceBoardTableCell.data("cell.Column.Data");
                source.swimlane = sourceBoardTableCell.data("cell.Swimlane.Data");

                var target = {};
                target.column = $(boardTableCell).data("cell.Column.Data");
                target.swimlane = $(boardTableCell).data("cell.Swimlane.Data");

                var data = {};
                data.source = source;
                data.target = target;
                data.boardItem = boardItemData;

                // call external drop handlers
                try {
                    self._showLoadIndicator();

                    if (null != self.options.drop) {
                        self.options.drop(event, data);
                        succeedHandler();
                    } else if (null != self.options.dropAsync) {
                        self.options.dropAsync(event, data, succeedHandler, errorHandler);
                    }
                } catch (err) {
                    self._hideLoadIndicator();
                    event.stopImmediatePropagation();
                    return;
                }

                // if an error occurs after dropping the error handler is called
                function errorHandler(message) {
                    self._hideLoadIndicator();
                    alert(message);
                }

                // after visual dropping (moving) the boardItem in the gui, move the boardItem in the model and refresh
                // the gui
                function succeedHandler() {
                    self._hideLoadIndicator();

                    boardItemData.column = targetCol;
                    boardItemData.swimlane = targetSwim;

                    // refresh and add items to target cell
                    var targetBoardItems = self.global.boardItems[targetSwim][targetCol];
                    targetBoardItems.push(boardItemData);
                    self._addBoardItemsToTableCell(targetBoardItems, targetCol, targetSwim);

                    // refresh and remove from source cell
                    var sourceBoardItems = self.global.boardItems[sourceSwim][sourceCol];
                    sourceBoardItems = sourceBoardItems.filter(function(current) {
                        return !(current.id == boardItemData.id);
                    })

                    self.global.boardItems[sourceSwim][sourceCol] = sourceBoardItems;
                    self._addBoardItemsToTableCell(sourceBoardItems, sourceCol, sourceSwim);

                    //finally remove hover container, if the container was used
                    self.global.boardItemHoverContainer.children().remove();
                }
            }
        });
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _createLargeBoardItem: function(boardItemData, self) {
		
        var boardItem = $("<div class='boardItem ui-helper-clearfix ui-widget ui-widget-content ui-corner-all'>");

        ///////////////////////////////////////////////////////////
        // create highlight
        ///////////////////////////////////////////////////////////
        if (null != boardItemData.color) {
            var boardItemMarker = $("<div>");
            boardItemMarker.appendTo(boardItem);
            boardItemMarker.addClass("boardItem_marker");
            boardItemMarker.css("color", boardItemData.color);
        }

        ///////////////////////////////////////////////////////////
        // create content
        ///////////////////////////////////////////////////////////
        var boardItemContent = $("<div>");
        boardItemContent.appendTo(boardItem);
        boardItemContent.addClass("boardItem_content");
        if (null != boardItemData.content.view.funcOrUrl) {
            boardItemContent.addClass("clickable");
            boardItemContent.click(boardItem, boardItemData.content.view.funcOrUrl);
        }

        ///////////////////////////////////////////////////////////
        // add content label
        ///////////////////////////////////////////////////////////
        var boardItemContentLabel = $("<div>");
        boardItemContentLabel.text(boardItemData.content.label);
        boardItemContent.append(boardItemContentLabel);

        ///////////////////////////////////////////////////////////
        // add content sub label
        ///////////////////////////////////////////////////////////
        if (null != boardItemData.content.sublabel) {
            var boardItemContentsubLabel = $("<div>");
            boardItemContentsubLabel.text(boardItemData.content.sublabel);
            boardItemContent.append(boardItemContentsubLabel);
        }

        ///////////////////////////////////////////////////////////
        // create footer
        ///////////////////////////////////////////////////////////
        var boardItemFooter = $("<div>");
        boardItemFooter.addClass("boardItem_footer");
        boardItemFooter.appendTo(boardItem);

        ///////////////////////////////////////////////////////////
        // create footer categories
        ///////////////////////////////////////////////////////////
        var boardItemCategories = $("<div>");
        boardItemCategories.appendTo(boardItemFooter);
        boardItemCategories.addClass("boardItem_categories");

        for (var x in boardItemData.categories) {
            var categorie = boardItemData.categories[x];
            var boardItemCat = $("<div>");
            boardItemCat.appendTo(boardItemCategories);
            boardItemCat.addClass("boardItem_categorie")
            boardItemCat.text(categorie.label);

            if (null != categorie.funcOrUrl) {
                boardItemCat.addClass("clickable");
                boardItemCat.click(categorie.funcOrUrl);
            }
        }

        ///////////////////////////////////////////////////////////
        // create footer links
        ///////////////////////////////////////////////////////////
        var boardItemLinks = $("<div>")
            .addClass("boardItem_icons");
        boardItemLinks.appendTo(boardItemFooter);

        ///////////////////////////////////////////////////////////
        // add footer link icons
        ///////////////////////////////////////////////////////////
        for (var i in boardItemData.icons) {
            var icon = boardItemData.icons[i];

            var boardItemLink = $("<a>");
            boardItemLinks.append(boardItemLink);
			
			if(null != icon.funcOrUrl) {
				console.log(icon.funcOrUrl);
				boardItemLink.addClass("clickable");
                boardItemLink.click(boardItemData, icon.funcOrUrl);
			}

            var boardItemIcon = $("<img>")
                .attr("src", icon.image);

            boardItemLink.append(boardItemIcon);
        }

        ///////////////////////////////////////////////////////////
        // create footer edit link
        ///////////////////////////////////////////////////////////
        if (boardItemData.content.edit.funcOrUrl != null) {
            var boardItemLink = $("<div>")
                .addClass("ui-icon").addClass("ui-icon-pencil")
                .addClass("clickable")
                .click(boardItemData, boardItemData.content.edit.funcOrUrl);
            boardItemLinks.append(boardItemLink);
        }

        ///////////////////////////////////////////////////////////
        // make board item draggable
        ///////////////////////////////////////////////////////////
        // add only, if an external drop handler is defined
        if (null != this.options.drop || null != this.options.dropAsync) {
            boardItem.data("boardItem.Data", boardItemData);
			
            boardItem.draggable({
                revert: "invalid",
                cursor: "move",
                opacity: 0.5,
                helper: "clone"
            });
        }
        return boardItem;
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _createSmallBoardItem: function(boardItemData, self) {
		
        var boardItem = $("<span class='boardItem ui-helper-clearfix ui-widget ui-widget-content ui-corner-all'>");
        boardItem.addClass("clickable");

        ///////////////////////////////////////////////////////////
        // add label
        ///////////////////////////////////////////////////////////
        var boardItemContentLabel = $("<div>");
        boardItemContentLabel.text(boardItemData.content.label);
        boardItem.append(boardItemContentLabel);

        ///////////////////////////////////////////////////////////
        // add sub label
        ///////////////////////////////////////////////////////////
        if (null != boardItemData.content.sublabel) {
            var boardItemContentsubLabel = $("<div>");
            boardItemContentsubLabel.text(boardItemData.content.sublabel);
            boardItem.append(boardItemContentsubLabel);
        }

        ///////////////////////////////////////////////////////////
        // define boarder color
        ///////////////////////////////////////////////////////////
        if (null != boardItemData.color) {
            boardItemContentLabel.css("border-left", "4px solid #27ae60");
        }

        ///////////////////////////////////////////////////////////
        // add hover effect for showing larger board item
        ///////////////////////////////////////////////////////////
        boardItem.click(
            function showBoardItemHoverContainer(event) {
                var container = self.global.boardItemHoverContainer;
                container.children().remove();
                container.append(self._createLargeBoardItem(boardItemData));
                container.zIndex($(this).zIndex() + 10);

                // center position of the container
				self._position(boardItemContentLabel, container);

                //self.global.boardItemHoverContainer.position({of: boardItemContentLabel});
                container.fadeIn();
            }
        );

        ///////////////////////////////////////////////////////////
        // make board item draggable
        ///////////////////////////////////////////////////////////
        // add only, if an external drop handler is defined
        if (null != self.options.drop || null != self.options.dropAsync) {
            boardItem.data("boardItem.Data", boardItemData);
            boardItem.draggable({
                revert: "invalid",
                cursor: "move",
                opacity: 0.5,
                helper: "clone"
            });
        }
        return boardItem;
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _intializeOptions: function() {

        /*
         * first remove the existing items from the status board 
         */
        this.element.children().remove();

        /*
         * define create board item function 
         */
        switch (this.options.boardItemSize) {
            case "large":
                this.global.createBoardItemFunction = this._createLargeBoardItem;
                break;

            case "small":
                this.global.createBoardItemFunction = this._createSmallBoardItem;
                break;

            default:
                var errMsg = "error: value for boardItemSize not defined: " + this.options.boardItemSize;
                console.log(errMsg);
                throw (errMsg);
        }

        /*
         * 
         */
        if (null == this.options.swimlanes || this.options.swimlanes.length == 0) {
            this.options.swimlanes = [{
                id: 1,
                label: "-"
            }];
            for (var i in this.options.boardItems) {
                var boardItem = this.options.boardItems[i];
                boardItem.swimlane = 1;
                this.global.hasSwimlanes = false;
            }
        }

        for (var i in this.options.swimlanes) {
            var swimlane = this.options.swimlanes[i];
            swimlane.id = swimlane.id + "";
            swimlane.label = swimlane.label + "";

            if (!swimlane.id || !swimlane.id.length ||
                !swimlane.label || !swimlane.label.length) {
                var errMsg = "error: swimlane item must have an id and a label!";
                console.log(errMsg);
                throw (errMsg);
            }
        }

        for (var i in this.options.columns) {
            var column = this.options.columns[i];
            column.id = column.id + "";
            column.label = column.label + "";

            if (!column.id || !column.id.length ||
                !column.label || !column.label.length) {
                var errMsg = "error: column Item must have an id and a label!";
                console.log(errMsg);
                throw (errMsg);
            }
        }

        /*
         * check if board item id is defined
         */
        for (var i in this.options.boardItems) {
            var boardItem = this.options.boardItems[i];

            if (!boardItem.id || boardItem.id.length == 0) {
                var errMsg = "error: board item id must be defined for all board items!";
                console.log(errMsg);
                console.log(boardItem);
                throw (errMsg);
            }
        }

        /*
         * check if board item id is unique
         */
        var boardItems = {};
        for (var i in this.options.boardItems) {
            var boardItem = this.options.boardItems[i];
            if (null != boardItems[boardItem.id]) {
                var errMsg = "error: board item id " + boardItem.id + " already exists!";
                console.log(errMsg);
                throw (errMsg);
            }

            boardItems[boardItem.id] = boardItem;
        }

        for (var i in this.options.boardItems) {
            var boardItem = this.options.boardItems[i];
            boardItem.column = boardItem.column + "";
            boardItem.swimlane = boardItem.swimlane + "";

            if (!boardItem.column || !boardItem.column.length ||
                !boardItem.swimlane || !boardItem.swimlane.length ||
                !boardItem.content || !boardItem.content.label || !boardItem.content.label.length) {
                var errMsg = "error: board items must have a column-, swimlane-value and a label defined!";
                console.log(errMsg);
                console.log(boardItem);
                throw (errMsg);
            }

            /*
             * check clickable objects (view or edit)
             */
            boardItem.content.edit = this._createClickableFunction(boardItem.content.edit, this.options.boardItemEdit);
            boardItem.content.view = this._createClickableFunction(boardItem.content.view, this.options.boardItemView);

            /*
             * iterate all categories for checking clickable objects
             */
            for (var x in boardItem.categories) {
                var categorie = boardItem.categories[x];
                categorie = this._createClickableFunction(categorie);

                if (null == categorie.label) {
                    var errMsg = "each categorie must have a label defined!";
                    console.log(errMsg);
                    throw (errMsg);
                }
            }

            for (var i in boardItem.icons) {
                var icon = boardItem.icons[i];
                icon = this._createClickableFunction(icon);

                if (null == icon.image) {
                    var errMsg = "each icon must have an image defined!";
                    console.log(errMsg);
                    throw (errMsg);
                }
            }
        }

        /*
         * read collapsed (swimlane) information from outsourced event handler
         */
        for (var i in this.options.swimlanes) {
            var swimlane = this.options.swimlanes[i];
            var data = this._cloneXYItem(swimlane, "swimlane");
            this._trigger("getCollapsedStatus", null, data);
            swimlane.collapsed = data.collapsed;
        }

        /*
         * check, if collapsed (swimlane) informations are correct
         */
        for (var i in this.options.swimlanes) {
            var swimlane = this.options.swimlanes[i];
            if (null == swimlane.collapsed) {
                swimlane.collapsed = false;
            }
            if ("boolean" != typeof(swimlane.collapsed)) {
                var errMsg = "error: swimlane id=" + swimlane.id + " has an invalid collapsed definition (type=" + typeof(swimlane.collapsed) + ")!";
                console.log(errMsg);
                throw (errMsg);
            }
        }

        /*
         * read collapsed (column) information from outsourced event handler
         */
        for (var i in this.options.columns) {
            var column = this.options.columns[i];
            var data = this._cloneXYItem(column, "column");
            this._trigger("getCollapsedStatus", null, data);
            column.collapsed = data.collapsed;
        }

        /*
         * check, if collapsed (column) informations are correct
         */
        for (var i in this.options.columns) {
            var column = this.options.columns[i];
            if (null == column.collapsed) {
                column.collapsed = false;
            }
            if ("boolean" != typeof(column.collapsed)) {
                var errMsg = "error: column id=" + column.id + " has an invalid collapsed definition (type=" + typeof(column.collapsed) + ")!";
                console.log(errMsg);
                throw (errMsg);
            }
        }
    },

    /**************************************************************************
     ******
     *************************************************************************/
    _initializeBoardItems: function() {
        this.global.boardItems = {};

        /*
         * 
         */
        for (var s in this.options.swimlanes) {
            var swimlane = this.options.swimlanes[s];
            this.global.boardItems[swimlane.id] = {};

            for (var c in this.options.columns) {
                var column = this.options.columns[c];
                this.global.boardItems[swimlane.id][column.id] = [];
            }
        }

        /*
         * 
         */
        for (var index in this.options.boardItems) {
            var boardItem = this.options.boardItems[index];
            var boardItemY = this.global.boardItems[boardItem.swimlane];

            if (null == boardItemY) {
                var errMsg = "error: board-item swimlane value \"" + boardItem.swimlane + "\" (column value: " + boardItem.column + ") does not exist!";
                console.log(errMsg);
                throw (errMsg);
            }

            var boardItemXY = boardItemY[boardItem.column];
            if (null == boardItemXY) {
                var errMsg = "error: board-item column value \"" + boardItem.column + "\" (swimlane value: " + boardItem.swimlane + ") does not exist!";
                console.log(errMsg);
                throw (errMsg);
            }

            boardItemY[boardItem.column].push(boardItem);
        }
    }
}); // END: $.widget( "custom.statusBoard",