import React from 'react';
import './App.css';

import Alert from '@mui/material/Alert';
import Autocomplete from '@mui/material/Autocomplete';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Collapse from '@mui/material/Collapse';
import Stack from '@mui/material/Stack';
import TextField from '@mui/material/TextField';
import Snackbar from '@mui/material/Snackbar';

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

function showCountry(country) {
	window.globe.pointOfView({
		lat: country.coords[0],
		lng: country.coords[1],
		altitude: 1.7,
	}, 1.5e3)
}

function App() {

	const [currentCountry, setCurrentCountry] = React.useState(countryData[154])
	const [input, setInput] = React.useState(null)
	const [open, setOpen] = React.useState(false);
	const [correct, setCorrect] = React.useState(false);
	const [hint, setHint] = React.useState(false);
	const [places, setPlaces] = React.useState(null);



	function chooseRandomFlag() {
		let weights = countryData.map(d => Math.min(d.pop, 1e7))
		let i = weightedRandom(weights)
		setCurrentCountry(countryData[i])
		showCountry(countryData[i])
		setOpen(false)
		setInput(null)
	}


	function checkAnswer(country) {
		setOpen(true)
		if (country === currentCountry) {
			setCorrect(true)
			setTimeout(chooseRandomFlag, 1e3)

		} else {
			setCorrect(false)
		}
	}

	function getHint() {
		setHint(currentCountry.name)
		setTimeout(() => setHint(false), 2e3)
	}

	const globeEl = <Globe
		ref={el => window.globe ||= el}
		globeImageUrl="/earth-day.jpg"
		backgroundColor="white"
		width={300}
		height={200}

		labelsData={[currentCountry]}
		labelLat={d => d.coords[0]}
		labelLng={d => d.coords[1]}
		labelText={d => ""}
		labelDotRadius={d => Math.exp(Math.log10(d.pop)/4)}
		labelColor={() => 'rgba(255, 255, 255, 0.5)'}
		labelResolution={1}
	/>

	const countryInputEl = <Autocomplete
		id="country-select"
		options={countryData}
		autoHighlight
		getOptionLabel={(country) => country.name}
		renderOption={(props, country) => (
			<Box component="li" {...props}>
				{country.name}
				<div className="population-label"
				>{bigNumberFormatter.format(country.pop)}</div>
			</Box>
		)}
		renderInput={(params) => (
			<TextField {...params}
				label={hint || "Choose a country"}
				inputProps={{
					...params.inputProps,
					autoComplete: 'new-password', // disable autocomplete and autofill
				}}
			/>
		)}
		value={input}
		onChange={(event, country) => {
			setInput(country)
			checkAnswer(country)
		}}
		onKeyDown={(event) => {
			setOpen(false)
			if (event.key === '?') {
				event.defaultMuiPrevented = true;
				getHint()
				event.preventDefault()
			}
		}}
	/>

	const flagEl = <div className="flag-wrapper">
		<img
			className="flag"
			src={`/flags/${currentCountry.name}.svg`}
			title={currentCountry.name}
			alt=""
		/>
	</div>

	return (
		<div className="App">
			<Stack direction="column">
				<Stack
					direction="column"
					spacing={3}
					sx={{
						width: 300,
						margin: 'auto',
					}}
				>
					<h1 style={{marginBottom: 0}}>Flag Quizzer</h1>
					{flagEl}
					<Stack direction="row"
						justifyContent="space-between"
					>
						<Button
							variant="outlined"
							onClick={chooseRandomFlag}
						>New Flag</Button>
						<Button
							variant="outlined"
							onClick={getHint}
						>Hint</Button>
					</Stack>
					{countryInputEl}
					{/*<Collapse in={open}>
						<Alert severity={correct ? "success" : "error"}>
							{correct ? "Correct" : "Incorrect"}
						</Alert>
					</Collapse>*/}
					<Snackbar open={open}
						anchorOrigin={{vertical: 'top', horizontal: 'center'}}
					>
						<Alert severity={correct ? "success" : "error"} elevation={24}>
							{correct ? "Correct" : "Incorrect"}
						</Alert>
					</Snackbar>
					<Button
						variant="outlined"
						onClick={() => checkAnswer(input)}
					>Check</Button>
					{globeEl}
					
				</Stack>
			</Stack>
		</div>
	);
}

export default App;
