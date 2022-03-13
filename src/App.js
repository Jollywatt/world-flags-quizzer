import React from 'react';
import './App.css';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
// import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';
import Switch from '@mui/material/Switch';

import Globe from 'react-globe.gl';

import {countryData} from './countries.js';


const bigNumberFormatter = Intl.NumberFormat('en', {
	notation: 'compact'
})


function weightedRandom(weights) {
	let total = weights.reduce((a, b) => a + b)
	let x = Math.random()*total
	for (let i = 0; i < weights.length; i++) {
		x -= weights[i]
		if (x < 0) return i
	}
}

function showCountryOnGlobe(country) {
	window.globe.pointOfView({
		lat: country.coords[0],
		lng: country.coords[1],
		altitude: 1.7,
	}, 1.5e3)
}



function App() {

	const [currentCountry, setCurrentCountry] = React.useState(countryData[154])
	const [input, setInput] = React.useState(null)
	const [correct, setCorrect] = React.useState(null);
	const [message, setMessage] = React.useState(false)
	const [knowsFlag, setKnowsFlag] = React.useState(true)


	function chooseRandomFlag() {
		let weights = countryData.map(d => (
			d.correctCount > 0 ? 0 : Math.min(d.pop, 1e70)
		))
		let i = weightedRandom(weights)
		countryData[i].onCorrect = () => {
			countryData[i].correctCount = (countryData[i].correctCount || 0) + 1
		}
		setCurrentCountry(countryData[i])
		setCorrect(null)
		setInput(null)
		setMessage(false)
		setKnowsFlag(true)

		showCountryOnGlobe(countryData[i])
	}


	function showSelected() {
		if (!input) return giveMessage("Select a country first")
		setCurrentCountry(input)
		showCountryOnGlobe(input)
		setKnowsFlag(false)
	}



	React.useEffect(chooseRandomFlag, []) // runs when app loads

	function checkAnswer(country) {
		if (!country) return

		if (country === currentCountry) {
			setCorrect(true)
			setTimeout(chooseRandomFlag, 1e3)
			if (knowsFlag) currentCountry.onCorrect()

		} else {
			setCorrect(false)
			setKnowsFlag(false)
		}
	}

	function giveMessage(message) {
		setMessage(message)
		setTimeout(() => setMessage(false), 2e3)
	}

	function giveHint(message) {
		giveMessage(currentCountry.name)
		setKnowsFlag(false)
	}

	const globeEl = <div className="globe">
		<Globe
			ref={el => window.globe ||= el}
			globeImageUrl={`${process.env.PUBLIC_URL}/earth-day.jpg`}
			backgroundColor="white"
			width={300}
			height={250}

			labelsData={[currentCountry]}
			labelLat={d => d.coords[0]}
			labelLng={d => d.coords[1]}
			labelText={d => ""}
			labelDotRadius={d => Math.exp(Math.log10(d.pop)/4)}
			labelColor={() => 'rgba(255, 255, 255, 0.5)'}
			labelResolution={1}
		/>
	</div>

	let changedByEnterKey = false
	console.log("Falsing")

	const countryInputEl = <Autocomplete
		id="country-select"
		options={countryData}
		autoHighlight
		getOptionLabel={(country) => country.name}
		renderOption={(props, country) => (
			<Box component="li" {...props}
				sx={ country.correctCount ? {
					color: 'green',
					'&::before': {
						content: '"✔︎"',
						paddingRight: 1
					}
				} : {}}
			>
				{country.name}
				<div className="population-label"
				>{bigNumberFormatter.format(country.pop)}</div>
			</Box>
		)}
		renderInput={(params) => (
			<TextField {...params}
				label={message || "Choose a country"}
				inputProps={{
					...params.inputProps,
					autoComplete: 'new-password', // disable autocomplete and autofill
				}}
			/>
		)}
		value={input}
		onChange={(event, country) => {
			setInput(country)
			if (changedByEnterKey) checkAnswer(country)
			changedByEnterKey = false
		}}
		onKeyDown={(event) => {
			if (event.key === '?') {
				event.defaultMuiPrevented = true;
				giveHint()
				event.preventDefault()
			} else if (event.key === 'Enter') {
				changedByEnterKey = true
			}
		}}
	/>

	const flagEl = <div className="flag-wrapper">
		<img
			className="flag"
			src={`${process.env.PUBLIC_URL}/flags/${currentCountry.name}.svg`}
			title={currentCountry.name}
			alt=""
		/>
	</div>

	return (
		<div className="App">
			<Snackbar
				anchorOrigin={{vertical: 'top', horizontal: 'center'}}
				open={correct === true && knowsFlag}
			>
				<Alert elevation={4} severity="success">Memorized!</Alert>
			</Snackbar>
			<Snackbar
				anchorOrigin={{vertical: 'top', horizontal: 'center'}}
				open={correct === true && !knowsFlag}
			>
				<Alert elevation={4} severity="success">Correct</Alert>
			</Snackbar>
			<Snackbar
				anchorOrigin={{vertical: 'top', horizontal: 'center'}}
				open={correct === false}
				autoHideDuration={1e3}
				onClose={() => setCorrect(null)}
			>
				<Alert elevation={4} severity="error">
					Incorrect
				</Alert>
			</Snackbar>
			<Stack direction="column">
				<Stack
					direction="column"
					spacing={3}
					sx={{
						width: 300,
						margin: 'auto',
					}}
				>
					{flagEl}
					<Stack direction="row"
						justifyContent="space-between"
					>
						<Button
							// variant="outlined"
							onClick={chooseRandomFlag}
						>New Flag</Button>
						<Button
							// variant="contained"
							onClick={showSelected}
						>Show flag</Button>
					</Stack>

					{countryInputEl}

					<Stack direction="row"
						justifyContent="space-between"
					>
						<Button
							variant="contained"
							onClick={() => checkAnswer(input)}
						>Check</Button>
						<Button
							onClick={() => giveHint()}
						>Show country</Button>
					</Stack>

					{globeEl}

				</Stack>
			</Stack>
		</div>
	);
}

export default App;
