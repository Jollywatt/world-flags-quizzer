import React from 'react'

import {
	Alert,
	Autocomplete,
	Box,
	Button,
	FormLabel,
	Grow,
	Stack,
	TextField,
	ThemeProvider,
	createTheme,
} from '@mui/material'

import { SnackbarProvider, useSnackbar } from 'notistack';

import Globe from 'react-globe.gl'

import './App.css'
import {countryData, worldPopulation} from './countries.js'


const bigNumberFormatter = Intl.NumberFormat('en', {
	notation: 'compact'
})
const percentageFormatter = Intl.NumberFormat('en', {
	maximumSignificantDigits: 4,
})


function weightedRandom(weights) {
	let total = weights.reduce((a, b) => a + b)
	let x = Math.random()*total
	for (let i = 0; i < weights.length; i++) {
		x -= weights[i]
		if (x < 0) return i
	}
}

function showOnGlobe(country) {
	window.globeRef.current.pointOfView({
		lat: country.coords[0],
		lng: country.coords[1],
		altitude: 1.7,
	}, 1.5e3)
}


const theme = createTheme({
  breakpoints: {
    values: {
      xs: 0,
      sm: 660,
    },
  },
});


function App() {

	const [input, setInput] = React.useState(null)
	const [message, setMessage] = React.useState(false)
	const [knowsFlag, setKnowsFlag] = React.useState(true)
	const [userProgress, setUserProgress] = React.useState(new Set())
	const [currentCountry, setCurrentCountry] = React.useState(countryData[0])

	const { enqueueSnackbar } = useSnackbar()

	function chooseRandomFlag() {
		let weights = countryData.map(d => (
			// userProgress.has(d.name) ? 0 : Math.sqrt(d.pop)
			userProgress.has(d.name) ? 0 : Math.min(d.pop, 2e8)
		))
		let i = weightedRandom(weights)
		setCurrentCountry(countryData[i])
		showOnGlobe(countryData[i])

		setInput(null)
		setMessage(false)
		setKnowsFlag(true)
	}
 
	function memorizeCountry(name) {
		setUserProgress(userProgress.add(name))
		localStorage.setItem('memorizedCountries', Array.from(userProgress).join('|'))
	}

	function showSelected() {
		if (!input) return giveMessage("⚠️ Select a country first")
		setCurrentCountry(input)
		showOnGlobe(input)
		setKnowsFlag(false)
	}

	function checkAnswer(country) {
		if (!country) return giveMessage("⚠️ Select a country first!")

		if (country === currentCountry) {
			setTimeout(chooseRandomFlag, 0.75e3)
			if (knowsFlag) {
				memorizeCountry(country.name)
				enqueueSnackbar({message: "Memorized!", variant: "success"})
			} else {
				enqueueSnackbar({message: "Correct", variant: "success"})
			}
		} else {
			setKnowsFlag(false)
			enqueueSnackbar({message: "Incorrect", variant: "error" })
		}
	}

	function giveMessage(text) {
		setMessage(text)
		setTimeout(() => setMessage(false), 2e3)
	}

	function giveHint(text) {
		if (message === false) giveMessage(currentCountry.name)
		showOnGlobe(currentCountry)
		setKnowsFlag(false)
	}




	// runs when app loads
	React.useEffect(() => {
		// load saved progress
		let memorizedCountries = localStorage.getItem('memorizedCountries')
		let userProgress = memorizedCountries ? new Set(memorizedCountries.split('|')) : new Set()
		setUserProgress(userProgress)
		chooseRandomFlag()
	}, [])


	let submittedWithEnterKey = false

	const globeRef = React.useRef();
	window.globeRef = globeRef

	React.useEffect(() => {
      setTimeout(() => { // wait for scene to be populated (asynchronously)
        const directionalLight = globeRef.current.scene().children.find(obj3d => obj3d.type === 'DirectionalLight');

        if (globeRef.current.scene().children.length >= 5) return // already added lights

        directionalLight && directionalLight.position.set(1, 0, 0); // change light position to see the specularMap's effect
        directionalLight.intensity = 0.6

        const ambientLight = globeRef.current.scene().children.find(obj3d => obj3d.type === 'AmbientLight');
        ambientLight.intensity = 0.8

        let d2 = window.d2 = directionalLight.clone()

        d2.position.set(-1,1,1)
        globeRef.current.scene().add(d2)

      });
    }, []);

	const globeEl = <div className="globe">
		<Globe
			ref={globeRef}
			globeImageUrl={`${process.env.PUBLIC_URL}/earth-day.jpg`}
			bumpImageUrl={`${process.env.PUBLIC_URL}/earth-topology.png`}
			showAtmosphere={false}
			showGraticules={true}
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

	const flagEl = <div className="flag-wrapper">
		<img
			className="flag"
			src={`${process.env.PUBLIC_URL}/flags/${currentCountry.name}.svg`}
			title={currentCountry.name}
			alt=""
		/>
	</div>

	const countryInputEl = <Autocomplete
		id="country-select"
		options={countryData}
		autoHighlight
		getOptionLabel={(country) => country.name}
		renderOption={(props, country) => (
			<Box component="li" {...props}
				sx={ userProgress.has(country.name) ? {
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
			if (submittedWithEnterKey) checkAnswer(country)
			submittedWithEnterKey = false
		}}
		onKeyDown={(event) => {
			if (event.key === '?') {
				event.defaultMuiPrevented = true;
				giveHint()
				event.preventDefault()
			} else if (event.key === 'Enter') {
				submittedWithEnterKey = true
			}
		}}
	/>

	const progressIndicator = <Box>				
		{(() => {
			let popMemorized = countryData
				.filter(country => userProgress.has(country.name))
				.map(country => country.pop)
				.reduce((a, b) => a + b, 0)
			let pop = percentageFormatter.format(100*popMemorized/worldPopulation)
			return <FormLabel>
				{userProgress.size} of {countryData.length} flags memorized
				<br/>
				{pop}% of world population
			</FormLabel>
		})()}
	</Box>

	return <Stack className="App"
			alignItems={{ xs: 'center', sm: 'flex-end'}}
			justifyContent="center"
			direction={{ xs: 'column', sm: 'row' }}
			spacing={4}
			>

		<Stack direction="column" sx={{width: 300}} spacing={2}>

			{flagEl}

			<Stack direction="row" justifyContent="space-between">
				<Button onClick={() => giveHint()}>⬇︎ Show country</Button>
				<Button onClick={showSelected}>⬆︎ Show flag</Button>
			</Stack>

			{countryInputEl}

			<Stack direction="row" justifyContent="space-between">
				<Button onClick={chooseRandomFlag}>Random</Button>
				<Button variant="contained" onClick={() => checkAnswer(input)}>Check</Button>
			</Stack>

		</Stack>

		<Stack direction="column" sx={{width: 300}} spacing={2}>

			{globeEl}

			{progressIndicator}

			<Button
				color="error"
				onClick={() => {
					setUserProgress(new Set())
					localStorage.setItem('memorizedCountries', '')
				}}
			>Reset progress</Button>

		</Stack>
	</Stack>
}

export default function IntegrationNotistack() {
	return <SnackbarProvider maxSnack={1}
		autoHideDuration={1.5e3}
		anchorOrigin={{
			vertical: 'top',
			horizontal: 'center',
		}}
		TransitionComponent={Grow}
		content={(_, {message, variant}) => (
			<Alert elevation={4} severity={variant}>{message}</Alert>
		)}>
		<ThemeProvider theme={theme}>
			<App/>
		</ThemeProvider>
	</SnackbarProvider>
}