import { Router } from "express"
import { getByLocation } from "../controllers/CityRateController.js"
import { getByLocation as getByLocation1 } from "../controllers/Local/LocalRateChart.js"

const chart=Router()


chart.post("/oneway",getByLocation)
chart.post("/local",getByLocation1)



export default chart