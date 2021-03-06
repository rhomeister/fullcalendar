function ResourceEventRenderer() {
    var t = this;

    // exports
    t.renderEvents = renderEvents;
    t.compileDaySegs = compileDaySegs; // for DayEventRenderer
    t.clearEvents = clearEvents;
    t.slotSegHtml = slotSegHtml;
    t.bindDaySeg = bindDaySeg;

    // imports
    DayEventRenderer.call(t);
    var opt = t.opt;
    var trigger = t.trigger;
    //var setOverflowHidden = t.setOverflowHidden;
    var isEventDraggable = t.isEventDraggable;
    var isEventResizable = t.isEventResizable;
    var eventEnd = t.eventEnd;
    var reportEvents = t.reportEvents;
    var reportEventClear = t.reportEventClear || function() {};
    var eventElementHandlers = t.eventElementHandlers;
    var setHeight = t.setHeight;
    var getDaySegmentContainer = t.getDaySegmentContainer;
    var getSlotSegmentContainer = t.getSlotSegmentContainer;
    var getHoverListener = t.getHoverListener;
    var getMaxMinute = t.getMaxMinute;
    var getMinMinute = t.getMinMinute;
    var timePosition = t.timePosition;
    var colContentLeft = t.colContentLeft;
    var colContentRight = t.colContentRight;
    var renderDaySegs = t.renderDaySegs;
    var resizableDayEvent = t.resizableDayEvent; // TODO: streamline binding architecture
    var getColCnt = t.getColCnt;
    var getColWidth = t.getColWidth;
    var getSnapHeight = t.getSnapHeight;
    var getSnapMinutes = t.getSnapMinutes;
    var getBodyContent = t.getBodyContent;
    var reportEventElement = t.reportEventElement;
    var showEvents = t.showEvents;
    var hideEvents = t.hideEvents;
    var eventDrop = t.eventDrop;
    var eventResize = t.eventResize;
    var renderDayOverlay = t.renderDayOverlay;
    var clearOverlays = t.clearOverlays;
    var calendar = t.calendar;
    var formatDate = calendar.formatDate;
    var formatDates = calendar.formatDates;
    var getResources = t.getResources;
    var getResource = t.getResource;


    /* Rendering
	----------------------------------------------------------------------------*/

function segCmp(a, b) {
	return (b.msLength - a.msLength) * 100 + (a.event.start - b.event.start);
}

    // event rendering utilities
// event rendering utilities
function sliceSegs(events, visEventEnds, start, end) {
	var segs = [],
		i, len=events.length, event,
		eventStart, eventEnd,
		segStart, segEnd,
		isStart, isEnd;
	for (i=0; i<len; i++) {
		event = events[i];
		eventStart = event.start;
		eventEnd = visEventEnds[i];
		if (eventEnd > start && eventStart < end) {
			if (eventStart < start) {
				segStart = cloneDate(start);
				isStart = false;
			}else{
				segStart = eventStart;
				isStart = true;
			}
			if (eventEnd > end) {
				segEnd = cloneDate(end);
				isEnd = false;
			}else{
				segEnd = eventEnd;
				isEnd = true;
			}
			segs.push({
				event: event,
				start: segStart,
				end: segEnd,
				isStart: isStart,
				isEnd: isEnd,
				msLength: segEnd - segStart
			});
		}
	}
	return segs.sort(segCmp);
}



    function renderEvents(events, modifiedEventId) {
        var i, len = events.length,
			dayEvents = [],
			slotEvents = [];
        for (i = 0; i < len; i++) {
            if (events[i].allDay) {
                dayEvents.push(events[i]);
            } else {
                slotEvents.push(events[i]);
            }
        }
        if (opt('allDaySlot')) {
            renderDaySegs(compileDaySegs(dayEvents), modifiedEventId);
            setHeight(); // no params means set to viewHeight
        }
        var segs = compileSlotSegs(slotEvents);
        renderSlotSegs(segs, modifiedEventId);
        trigger('eventAfterAllRender');
    }


    function clearEvents() {
        reportEventClear();
        getDaySegmentContainer().empty();
        getSlotSegmentContainer().empty();
    }


    function compileDaySegs(events) {
        var levels = stackSegs(sliceSegs(events, $.map(events, exclEndDay), t.visStart, t.visEnd)),
			i, levelCnt = levels.length, level,
			j, seg,
			segs = [];
        for (i = 0; i < levelCnt; i++) {
            level = levels[i];
            for (j = 0; j < level.length; j++) {
                seg = level[j];
                seg.row = 0;
                seg.level = i; // not needed anymore
                segs.push(seg);
            }
        }
        return segs;
    }


    function compileSlotSegs(events) {
        var colCnt = getColCnt(),
			minMinute = getMinMinute(),
			maxMinute = getMaxMinute(),
			d = addMinutes(cloneDate(t.visStart), minMinute),
			visEventEnds = $.map(events, slotEventEnd),
			i, col,
			j, level,
			k, seg,
			segs = [];
        col = stackResSegs(sliceSegs(events, visEventEnds, d, addMinutes(cloneDate(d), maxMinute - minMinute)));
        countResForwardSegs(col);
        for (i = 0; i < colCnt; i++) {
            var res = getResource(i);
            if (res) {
                for (j = 0; j < col.length; j++) {
                    level = col[j];
                    for (k = 0; k < level.length; k++) {
                        seg = level[k];
                        if (seg.event.resource_id == res.id) {
                            seg.col = i;
                            seg.level = j;
                            segs.push(seg);
                        }
                    }
                }
            }
            addDays(d, 1, true);
        }
        return segs;
    }

    function stackResSegs(segs) {
        var levels = [],
            i, len = segs.length, seg,
            j, collide, k;
        for (i = 0; i < len; i++) {
            seg = segs[i];
            j = 0; // the level index where seg should belong
            while (true) {
                collide = false;
                if (levels[j]) {
                    for (k = 0; k < levels[j].length; k++) {
                        if (segsResCollide(levels[j][k], seg)) {
                            collide = true;
                            break;
                        }
                    }
                }
                if (collide) {
                    j++;
                } else {
                    break;
                }
            }
            if (levels[j]) {
                levels[j].push(seg);
            } else {
                levels[j] = [seg];
            }
        }
        return levels;
    }

function cssKey(_element) {
	return _element.id + '/' + _element.className + '/' + _element.style.cssText.replace(/(^|;)\s*(top|left|width|height)\s*:[^;]*/ig, '');
}

    function segsResCollide(seg1, seg2) {
        return seg1.end > seg2.start && seg1.start < seg2.end && seg1.event.resource_id == seg2.event.resource_id;
    }

    function countResForwardSegs(levels) {
        var i, j, k, level, segForward, segBack;
        for (i = levels.length - 1; i > 0; i--) {
            level = levels[i];
            for (j = 0; j < level.length; j++) {
                segForward = level[j];
                for (k = 0; k < levels[i - 1].length; k++) {
                    segBack = levels[i - 1][k];
                    if (segsResCollide(segForward, segBack)) {
                        segBack.forward = Math.max(segBack.forward || 0, (segForward.forward || 0) + 1);
                    }
                }
            }
        }
    }

    function slotEventEnd(event) {
        if (event.end) {
            return cloneDate(event.end);
        } else {
            return addMinutes(cloneDate(event.start), opt('defaultEventMinutes'));
        }
    }


    // renders events in the 'time slots' at the bottom

    function renderSlotSegs(segs, modifiedEventId) {

        var i, segCnt = segs.length, seg,
			event,
			classes,
			top, bottom,
			colI, levelI, forward,
			leftmost,
			availWidth,
			outerWidth,
			left,
			html = '',
			eventElements,
			eventElement,
			triggerRes,
			vsideCache = {},
			hsideCache = {},
			key, val,
			titleElement,
			height,
			slotSegmentContainer = getSlotSegmentContainer(),
			rtl, dis, dit,
			colCnt = getColCnt();

        if (rtl = opt('isRTL')) {
            dis = -1;
            dit = colCnt - 1;
        } else {
            dis = 1;
            dit = 0;
        }

        // calculate position/dimensions, create html
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            event = seg.event;
            top = timePosition(seg.start, seg.start);
            bottom = timePosition(seg.start, seg.end);
            colI = seg.col;
            levelI = seg.level;
            forward = seg.forward || 0;
            leftmost = colContentLeft(colI * dis + dit);
            availWidth = colContentRight(colI * dis + dit) - leftmost;
            availWidth = Math.min(availWidth - 6, availWidth * .95); // TODO: move this to CSS
            if (levelI) {
                // indented and thin
                outerWidth = availWidth / (levelI + forward + 1);
            } else {
                if (forward) {
                    // moderately wide, aligned left still
                    outerWidth = ((availWidth / (forward + 1)) - (12 / 2)) * 2; // 12 is the predicted width of resizer =
                } else {
                    // can be entire width, aligned left
                    outerWidth = availWidth;
                }
            }
            left = leftmost +                                  // leftmost possible
				(availWidth / (levelI + forward + 1) * levelI) // indentation
				* dis + (rtl ? availWidth - outerWidth : 0);   // rtl
            seg.top = top;
            seg.left = left;
            seg.outerWidth = outerWidth;
            seg.outerHeight = bottom - top;
            html += slotSegHtml(event, seg);
        }
        slotSegmentContainer[0].innerHTML = html; // faster than html()
        eventElements = slotSegmentContainer.children();

        // retrieve elements, run through eventRender callback, bind event handlers
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            event = seg.event;
            eventElement = $(eventElements[i]); // faster than eq()
            triggerRes = trigger('eventRender', event, event, eventElement);
            if (triggerRes === false) {
                eventElement.remove();
            } else {
                if (triggerRes && triggerRes !== true) {
                    eventElement.remove();
                    eventElement = $(triggerRes)
						.css({
						    position: 'absolute',
						    top: seg.top,
						    left: seg.left
						})
						.appendTo(slotSegmentContainer);
                }
                seg.element = eventElement;
                if (event._id === modifiedEventId) {
                    bindSlotSeg(event, eventElement, seg);
                } else {
                    eventElement[0]._fci = i; // for lazySegBind
                }
                reportEventElement(event, eventElement);
            }
        }

        lazySegBind(slotSegmentContainer, segs, bindSlotSeg);

        // record event sides and title positions
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            if (eventElement = seg.element) {
                val = vsideCache[key = seg.key = cssKey(eventElement[0])];
                seg.vsides = val === undefined ? (vsideCache[key] = vsides(eventElement, true)) : val;
                val = hsideCache[key];
                seg.hsides = val === undefined ? (hsideCache[key] = hsides(eventElement, true)) : val;
                titleElement = eventElement.find('.fc-event-title');
                if (titleElement.length) {
                    seg.contentTop = titleElement[0].offsetTop;
                }
            }
        }

        // set all positions/dimensions at once
        for (i = 0; i < segCnt; i++) {
            seg = segs[i];
            if (eventElement = seg.element) {
                eventElement[0].style.width = Math.max(0, seg.outerWidth - seg.hsides) + 'px';
                height = Math.max(0, seg.outerHeight - seg.vsides);
                eventElement[0].style.height = height + 'px';
                event = seg.event;
                if (seg.contentTop !== undefined && height - seg.contentTop < 10) {
                    // not enough room for title, put it in the time (TODO: maybe make both display:inline instead)
                    eventElement.find('div.fc-event-time')
						.text(formatDate(event.start, opt('timeFormat')) + ' - ' + event.title);
                    eventElement.find('div.fc-event-title')
						.remove();
                }
                trigger('eventAfterRender', event, event, eventElement);
            }
        }

    }


    function slotSegHtml(event, seg) {
        var html = "<";
        var url = event.url;
        var skinCss = getSkinCss(event, opt);
        var classes = ['fc-event', 'fc-event-vert'];
        if (isEventDraggable(event)) {
            classes.push('fc-event-draggable');
        }
        if (seg.isStart) {
            classes.push('fc-event-start');
        }
        if (seg.isEnd) {
            classes.push('fc-event-end');
        }
        classes = classes.concat(event.className);
        if (event.source) {
            classes = classes.concat(event.source.className || []);
        }
        if (url) {
            html += "a href='" + htmlEscape(event.url) + "'";
        } else {
            html += "div";
        }
        html +=
			" class='" + classes.join(' ') + "'" +
			" style='position:absolute;z-index:8;top:" + seg.top + "px;left:" + seg.left + "px;" + skinCss + "'" +
			">" +
			"<div class='fc-event-inner'>" +
			"<div class='fc-event-time'>" +
			htmlEscape(formatDates(event.start, event.end, opt('timeFormat'))) +
			"</div>" +
			"<div class='fc-event-title'>" +
                (event.title || '') +
			"</div>" +
			"</div>" +
			"<div class='fc-event-bg'></div>";
        if (seg.isEnd && isEventResizable(event)) {
            html +=
				"<div class='ui-resizable-handle ui-resizable-s'>=</div>";
        }
        html +=
			"</" + (url ? "a" : "div") + ">";
        return html;
    }


    function bindDaySeg(event, eventElement, seg) {
        if (isEventDraggable(event)) {
            draggableDayEvent(event, eventElement, seg.isStart);
        }
        if (seg.isEnd && isEventResizable(event)) {
            resizableDayEvent(event, eventElement, seg);
        }
        eventElementHandlers(event, eventElement);
        // needs to be after, because resizableDayEvent might stopImmediatePropagation on click
    }


    function bindSlotSeg(event, eventElement, seg) {
        var timeElement = eventElement.find('div.fc-event-time');
        if (isEventDraggable(event)) {
            draggableSlotEvent(event, eventElement, timeElement);
        }
        if (seg.isEnd && isEventResizable(event)) {
            resizableSlotEvent(event, eventElement, timeElement);
        }
        eventElementHandlers(event, eventElement);
    }



    /* Dragging
	-----------------------------------------------------------------------------------*/


    // when event starts out FULL-DAY

    function draggableDayEvent(event, eventElement, isStart) {
        var origWidth;
        var revert;
        var allDay = true;
        var dayDelta;
        var dis = opt('isRTL') ? -1 : 1;
        var hoverListener = getHoverListener();
        var colWidth = getColWidth();
        var snapHeight = getSnapHeight();
        var snapMinutes = getSnapMinutes();
        var minMinute = getMinMinute();
        eventElement.draggable({
            zIndex: 9,
            opacity: opt('dragOpacity', 'month'), // use whatever the month view was using
            revertDuration: opt('dragRevertDuration'),
            start: function (ev, ui) {
                trigger('eventDragStart', eventElement, event, ev, ui);
                hideEvents(event, eventElement);
                origWidth = eventElement.width();
                hoverListener.start(function (cell, origCell, rowDelta, colDelta) {
                    clearOverlays();
                    if (cell) {
                        //setOverflowHidden(true);
                        revert = false;
                        dayDelta = colDelta * dis;
                        if (!cell.row) {
                            // on full-days
                            renderDayOverlay(
								addDays(cloneDate(event.start), dayDelta),
								addDays(exclEndDay(event), dayDelta)
							);
                            resetElement();
                        } else {
                            // mouse is over bottom slots
                            if (isStart) {
                                if (allDay) {
                                    // convert event to temporary slot-event
                                    eventElement.width(colWidth - 10); // don't use entire width
                                    setOuterHeight(
										eventElement,
										snapHeight * Math.round(
											(event.end ? ((event.end - event.start) / MINUTE_MS) : opt('defaultEventMinutes')) /
												snapMinutes
										)
									);
                                    eventElement.draggable('option', 'grid', [colWidth, 1]);
                                    allDay = false;
                                }
                            } else {
                                revert = true;
                            }
                        }
                        revert = revert || (allDay && !dayDelta);
                    } else {
                        resetElement();
                        //setOverflowHidden(false);
                        revert = true;
                    }
                    eventElement.draggable('option', 'revert', revert);
                }, ev, 'drag');
            },
            stop: function (ev, ui) {
                hoverListener.stop();
                clearOverlays();
                trigger('eventDragStop', eventElement, event, ev, ui);
                if (revert) {
                    // hasn't moved or is out of bounds (draggable has already reverted)
                    resetElement();
                    eventElement.css('filter', ''); // clear IE opacity side-effects
                    showEvents(event, eventElement);
                } else {
                    // changed!
                    var minuteDelta = 0;
                    if (!allDay) {
                        minuteDelta = Math.round((eventElement.offset().top - getBodyContent().offset().top) / snapHeight)
							* snapMinutes
							+ minMinute
							- (event.start.getHours() * 60 + event.start.getMinutes());
                    }
                    eventDrop(this, event, dayDelta, minuteDelta, allDay, ev, ui);
                }
                //setOverflowHidden(false);
            }
        });
        function resetElement() {
            if (!allDay) {
                eventElement
					.width(origWidth)
					.height('')
					.draggable('option', 'grid', null);
                allDay = true;
            }
        }
    }


    // when event starts out IN TIMESLOTS

    function draggableSlotEvent(event, eventElement, timeElement) {
        var origPosition;
        var allDay = false;
        var dayDelta;
        var minuteDelta;
        var prevMinuteDelta;
        var dis = opt('isRTL') ? -1 : 1;
        var hoverListener = getHoverListener();
        var colCnt = getColCnt();
        var colWidth = getColWidth();
        var snapHeight = getSnapHeight();
        var snapMinutes = getSnapMinutes();
        eventElement.draggable({
            zIndex: 9,
            scroll: false,
            grid: [colWidth, snapHeight],
            axis: colCnt == 1 ? 'y' : false,
            opacity: opt('dragOpacity'),
            revertDuration: opt('dragRevertDuration'),
            start: function (ev, ui) {
                trigger('eventDragStart', eventElement, event, ev, ui);
                hideEvents(event, eventElement);
                origPosition = eventElement.position();
                minuteDelta = prevMinuteDelta = 0;
                hoverListener.start(function (cell, origCell, rowDelta, colDelta) {
                    eventElement.draggable('option', 'revert', !cell);
                    clearOverlays();
                    if (cell) {
                        dayDelta = colDelta * dis;
                        if (opt('allDaySlot') && !cell.row) {
                            // over full days
                            if (!allDay) {
                                // convert to temporary all-day event
                                allDay = true;
                                timeElement.hide();
                                eventElement.draggable('option', 'grid', null);
                            }
                            renderDayOverlay(
								addDays(cloneDate(event.start), dayDelta),
								addDays(exclEndDay(event), dayDelta)
							);
                        } else {
                            // on slots
                            resetElement();
                        }
                    }
                }, ev, 'drag');
            },
            drag: function (ev, ui) {
                minuteDelta = Math.round((ui.position.top - origPosition.top) / snapHeight) * snapMinutes;
                if (minuteDelta != prevMinuteDelta) {
                    if (!allDay) {
                        updateTimeText(minuteDelta);
                    }
                    prevMinuteDelta = minuteDelta;
                }
            },
            stop: function (ev, ui) {
                var cell = hoverListener.stop();
                clearOverlays();
                trigger('eventDragStop', eventElement, event, ev, ui);
                if (cell && (dayDelta || minuteDelta || allDay)) {
                    // changed!
                    eventDrop(this, event, dayDelta, allDay ? 0 : minuteDelta, allDay, ev, ui);
                } else {
                    // either no change or out-of-bounds (draggable has already reverted)
                    resetElement();
                    eventElement.css('filter', ''); // clear IE opacity side-effects
                    eventElement.css(origPosition); // sometimes fast drags make event revert to wrong position
                    updateTimeText(0);
                    showEvents(event, eventElement);
                }
            }
        });
        function updateTimeText(minuteDelta) {
            var newStart = addMinutes(cloneDate(event.start), minuteDelta);
            var newEnd;
            if (event.end) {
                newEnd = addMinutes(cloneDate(event.end), minuteDelta);
            }
            timeElement.text(formatDates(newStart, newEnd, opt('timeFormat')));
        }
        function resetElement() {
            // convert back to original slot-event
            if (allDay) {
                timeElement.css('display', ''); // show() was causing display=inline
                eventElement.draggable('option', 'grid', [colWidth, snapHeight]);
                allDay = false;
            }
        }
    }



    /* Resizing
	--------------------------------------------------------------------------------------*/


    function resizableSlotEvent(event, eventElement, timeElement) {
        var snapDelta, prevSnapDelta;
        var snapHeight = getSnapHeight();
        var snapMinutes = getSnapMinutes();
        eventElement.resizable({
            handles: {
                s: '.ui-resizable-handle'
            },
            grid: snapHeight,
            start: function (ev, ui) {
                snapDelta = prevSnapDelta = 0;
                hideEvents(event, eventElement);
                eventElement.css('z-index', 9);
                trigger('eventResizeStart', this, event, ev, ui);
            },
            resize: function (ev, ui) {
                // don't rely on ui.size.height, doesn't take grid into account
                snapDelta = Math.round((Math.max(snapHeight, eventElement.height()) - ui.originalSize.height) / snapHeight);
                if (snapDelta != prevSnapDelta) {
                    timeElement.text(
						formatDates(
							event.start,
							(!snapDelta && !event.end) ? null : // no change, so don't display time range
								addMinutes(eventEnd(event), snapMinutes * snapDelta),
							opt('timeFormat')
						)
					);
                    prevSnapDelta = snapDelta;
                }
            },
            stop: function (ev, ui) {
                trigger('eventResizeStop', this, event, ev, ui);
                if (snapDelta) {
                    eventResize(this, event, 0, snapMinutes * snapDelta, ev, ui);
                } else {
                    eventElement.css('z-index', 8);
                    showEvents(event, eventElement);
                    // BUG: if event was really short, need to put title back in span
                }
            }
        });
    }
}
