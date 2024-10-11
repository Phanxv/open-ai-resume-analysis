import React, { Dispatch, SetStateAction } from 'react'
import { Select, MenuItem, FormControl, InputLabel, SelectChangeEvent } from '@mui/material';

interface LangSelectProps {
    language: string;
    setLanguage: Dispatch<SetStateAction<string>>;
}

const LanguageSelection = (props: LangSelectProps) => {
    const handleChange = (event: SelectChangeEvent<string>) => {
        props.setLanguage(event.target.value as string);
    };
    return (
        <FormControl fullWidth sx={{mb: '10px'}}>
            <InputLabel id="language-select">Language</InputLabel>
            <Select
                labelId="language-select"
                id="simple-select"
                value={props.language}
                label="Language"
                onChange={handleChange}
                defaultValue={"english"}
            >
                <MenuItem value={"english"}>English</MenuItem>
                <MenuItem value={"thai"}>Thai</MenuItem>
                <MenuItem value={"japanese"}>Japanese</MenuItem>
            </Select>
        </FormControl>
    );
}

export default LanguageSelection