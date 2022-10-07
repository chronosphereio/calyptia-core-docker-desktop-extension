import React from "react";
import CssBaseline from "@mui/material/CssBaseline";
import {DockerMuiThemeProvider} from "@docker/docker-mui-theme";
import {Core} from "./calyptia/Core";
import {Box, Stack} from "@mui/material";

export const App = () => {
    return (<DockerMuiThemeProvider>
        <CssBaseline/>
        <Stack direction="column" spacing={2}>
            <Box
                component="img"
                sx={{
                    alignSelf: "left",
                    height: 100,
                    width: 300,
                    marginTop: "30px",
                    marginBottom: "10px",
                    maxHeight: {xs: 150, md: 350},
                    maxWidth: {xs: 150, md: 350},
                }}
                src="./images/calyptia_horizontal.svg"/>
        </Stack>
        <Core/>
    </DockerMuiThemeProvider>);
}