import { CONFIG } from "./config.js";

export class SpatialHash {

    constructor() {

        this.cellSize =
            CONFIG.spatialCellSize;

        this.invCellSize =
            1 / this.cellSize;

        this.cells =
            new Map();
    }

    clear() {

        this.cells.clear();
    }

    getCellCoordinate(value) {

        return Math.floor(
            value *
            this.invCellSize
        );
    }

    getKey(x, y, z) {

        return (
            x +
            "," +
            y +
            "," +
            z
        );
    }

    insert(
        index,
        x,
        y,
        z
    ) {

        const cx =
            this.getCellCoordinate(x);

        const cy =
            this.getCellCoordinate(y);

        const cz =
            this.getCellCoordinate(z);

        const key =
            this.getKey(
                cx,
                cy,
                cz
            );

        let cell =
            this.cells.get(key);

        if (!cell) {

            cell = [];

            this.cells.set(
                key,
                cell
            );
        }

        cell.push(index);
    }

    build(positions) {

        this.clear();

        const count =
            positions.length / 3;

        for (
            let i = 0;
            i < count;
            i++
        ) {

            const index =
                i * 3;

            this.insert(
                i,
                positions[index],
                positions[index + 1],
                positions[index + 2]
            );
        }
    }

    query(
        x,
        y,
        z,
        radius,
        callback
    ) {

        const minX =
            this.getCellCoordinate(
                x - radius
            );

        const maxX =
            this.getCellCoordinate(
                x + radius
            );

        const minY =
            this.getCellCoordinate(
                y - radius
            );

        const maxY =
            this.getCellCoordinate(
                y + radius
            );

        const minZ =
            this.getCellCoordinate(
                z - radius
            );

        const maxZ =
            this.getCellCoordinate(
                z + radius
            );

        for (
            let cz = minZ;
            cz <= maxZ;
            cz++
        ) {

            for (
                let cy = minY;
                cy <= maxY;
                cy++
            ) {

                for (
                    let cx = minX;
                    cx <= maxX;
                    cx++
                ) {

                    const key =
                        this.getKey(
                            cx,
                            cy,
                            cz
                        );

                    const cell =
                        this.cells.get(key);

                    if (!cell)
                        continue;

                    for (
                        let i = 0;
                        i < cell.length;
                        i++
                    ) {

                        callback(
                            cell[i]
                        );
                    }
                }
            }
        }
    }
}