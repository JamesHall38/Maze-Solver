import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import Node from './Node/Node'
import { astar, getNodesInShortestPathOrder } from '../algorithms/astar'
import './Pathfinding.css'
import { recursiveDivision } from '../algorithms/recursiveDivision'


export default function Pathfinding() {

    const nodesPosition = useMemo(() => {
        return {
            rowLenght: Math.floor(window.innerHeight / 20 - 5) + ((Math.floor(window.innerHeight / 20 - 5)) % 2 ? 0 : 1),
            colLenght: Math.floor(window.innerWidth / 20 - 2) + ((Math.floor(window.innerWidth / 20 - 2)) % 2 ? 0 : 1),
            start: {
                row: 3,
                col: 3
            },
            finish: {
                row: Math.floor(window.innerHeight / 20 - 5) + ((Math.floor(window.innerHeight / 20 - 5)) % 2 ? 0 : 1) - 4,
                col: Math.floor(window.innerWidth / 20 - 2) + ((Math.floor(window.innerWidth / 20 - 2)) % 2 ? 0 : 1) - 4
            }
        }
    }, [])

    const getGrid = () => {
        const newGrid = []
        for (let row = 0; row < nodesPosition.rowLenght; row++) {
            const currentRow = []
            for (let col = 0; col < nodesPosition.colLenght; col++) {
                currentRow.push(
                    {
                        col,
                        row,
                        isStart: row === nodesPosition.start.row && col === nodesPosition.start.col,
                        isFinish: row === nodesPosition.finish.row && col === nodesPosition.finish.col,
                        distance: Infinity,
                        isWall: false,
                        previousNode: null,
                        cost: 0,
                        g: 0,
                        h: 0,
                    }
                )
            }
            newGrid.push(currentRow)
        }
        return (newGrid)
    }

    const [grid, setGrid] = useState(getGrid)
    const [mouseDown, setMouseDown] = useState(false)
    const timeout = useMemo(() => [], [])

    function handleMouseDown(row, col) {
        animateWall(row, col)
        setMouseDown(true)
    }
    function handleMouseEnter(row, col) {
        if (!mouseDown) return
        animateWall(row, col)
    }
    function handleMouseUp() {
        setMouseDown(false)
    }

    const animateShortestPath = useCallback((nodesInShortestPathOrder) => {
        for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
            timeout.push(setTimeout(() => {
                const node = nodesInShortestPathOrder[i]
                if (!node.isStart && !node.isFinish) {
                    document.getElementById(`node-${node.row}-${node.col}`).className =
                        'node node-shortest-path'
                }
            }, 50 * i))
        }
    }, [timeout])

    const animatePathFinding = useCallback((visitedNodesInOrder, nodesInShortestPathOrder) => {
        for (let i = 0; i <= visitedNodesInOrder.length; i++) {
            if (i === visitedNodesInOrder.length) {
                timeout.push(setTimeout(() => {
                    animateShortestPath(nodesInShortestPathOrder)
                }, 10 * i))
                return
            }
            timeout.push(setTimeout(() => {
                const node = visitedNodesInOrder[i]
                if (!node.isStart && !node.isFinish) {
                    document.getElementById(`node-${node.row}-${node.col}`).className =
                        'node node-visited'
                }
            }, 10 * i))
        }
    }, [animateShortestPath, timeout])

    const animateMaze = useCallback((nodesInShortestPathOrder) => {
        for (let i = 0; i < nodesInShortestPathOrder.length; i++) {
            timeout.push(setTimeout(() => {
                const node = nodesInShortestPathOrder[i]

                if (!node.isStart && !node.isFinish) {
                    document.getElementById(`node-${node.row}-${node.col}`).className =
                        'node node-wall'
                    node.isWall = true
                }
            }, 10 * i))

        }
    }, [timeout])

    const resetPathfinder = useCallback((removeWalls) => {
        timeout.forEach(e => { clearTimeout(e) })

        for (let row = 0; row < grid.length; row++) {
            for (let col = 0; col < grid[0].length; col++) {
                if (grid[row][col].isVisited && !grid[row][col].isStart && !grid[row][col].isFinish && !grid[row][col].isWall) {
                    document.getElementById(`node-${row}-${col}`).className =
                        'node node-empty'
                }
                grid[row][col].distance = Infinity
                grid[row][col].isVisited = false
                grid[row][col].previousNode = null


                if (removeWalls && grid[row][col].isWall) {
                    grid[row][col].isWall = false
                    document.getElementById(`node-${row}-${col}`).className =
                        'node node-empty'
                }
            }
        }
    }, [grid, timeout])

    const visualizePathFinding = useCallback(() => {
        resetPathfinder()
        const startNode = grid[nodesPosition.start.row][nodesPosition.start.col]
        const finishNode = grid[nodesPosition.finish.row][nodesPosition.finish.col]
        const visitedNodesInOrder = astar(grid, startNode, finishNode)
        const nodesInShortestPathOrder = getNodesInShortestPathOrder(finishNode)
        animatePathFinding(visitedNodesInOrder, nodesInShortestPathOrder)
    }, [grid, nodesPosition, resetPathfinder, animatePathFinding])

    const animateWall = useCallback((row, col) => {
        const newGrid = grid.slice()
        const node = newGrid[row][col]
        const newNode = (node.isStart || node.isFinish) ? node : {
            ...node,
            isWall: !node.isWall,
        };
        newGrid[row][col] = newNode
        setGrid(newGrid)
    }, [grid])

    const generateMaze = useCallback(() => {
        resetPathfinder(true)
        const startNode = grid[nodesPosition.start.row][nodesPosition.start.col]
        const finishNode = grid[nodesPosition.finish.row][nodesPosition.finish.col]
        const maze = recursiveDivision(grid, startNode, finishNode)
        animateMaze(maze)
        animateWall(0, grid[0].length - 1)
        return maze.length
    }, [nodesPosition, grid, resetPathfinder, animateWall, animateMaze])


    // On mount
    const isMounted = useRef(false)

    const onMount = useCallback(() => {
        const time = generateMaze()
        const delay = setTimeout(() => {
            visualizePathFinding()
        }, 10 * time)
        return () => { clearTimeout(delay) }
    }, [generateMaze, visualizePathFinding])

    useEffect(() => {
        if (!isMounted.current) {
            onMount()
            isMounted.current = true
        }
    }, [onMount])


    return (
        <>
            <button onClick={() => visualizePathFinding()}>
                Visualise AStar algorithm
            </button>
            <button onClick={() => resetPathfinder()}>
                Reset
            </button>
            <button onClick={() => resetPathfinder(true)}>
                Clear
            </button>
            <button onClick={() => generateMaze()}>
                Generate maze
            </button>
            <div className="grid">
                {grid.map((row, rowIdx) => {
                    return (
                        <div key={rowIdx}>
                            {row.map((node, nodeIdx) => {
                                const { row, col, isFinish, isStart, isWall } = node;
                                return (
                                    <Node
                                        key={nodeIdx}
                                        col={col}
                                        isFinish={isFinish}
                                        isStart={isStart}
                                        isWall={isWall}
                                        mouseIsPressed={mouseDown}
                                        onMouseDown={(row, col) => handleMouseDown(row, col)}
                                        onMouseEnter={(row, col) => handleMouseEnter(row, col)}
                                        onMouseUp={() => handleMouseUp()}
                                        row={row}></Node>
                                )
                            })}
                        </div>
                    )
                })}
            </div>
        </>
    )
}