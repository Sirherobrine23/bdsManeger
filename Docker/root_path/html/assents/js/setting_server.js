fetch(`http://${localStorage.getItem("bds_ip-remote")}:1932/configs`).then(response => response.json()).then(CONFIGS => {
    document.getElementById('name')          .value = CONFIGS.server_name;
    document.getElementById('gameMode')      .value = CONFIGS.gamemode;
    document.getElementById('difficulty')    .value = CONFIGS.difficulty;
    document.getElementById('timeout_server').value = CONFIGS.player_idle_timeout;
    document.getElementById('level_name')    .value = CONFIGS.level_name;
    document.getElementById('permissions')   .value = CONFIGS.default_player_permission_level;
    document.getElementById('max_pla')       .value = CONFIGS.max_players

    // cheats
    if (CONFIGS.allow_cheats == 'true'){document.getElementById('cheats').checked = true} else {document.getElementById('cheats').checked = false};
    // online mode
    if (CONFIGS.online_mode == 'true'){document.getElementById('xbox').checked = true} else {document.getElementById('xbox').checked = false};
    // cheats
    if (CONFIGS.white_list == 'true'){document.getElementById('whitelist').checked = true} else {document.getElementById('whitelist').checked = false};
})