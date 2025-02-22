import { Icon } from "@amplication/design-system";
import React from "react";
import { Plugin } from "./hooks/usePlugins";
import "./PluginLogo.scss";

const PLUGIN_LOGO_BASE_URL =
  "https://raw.githubusercontent.com/amplication/plugin-catalog/master/assets/";

const CLASS_NAME = "plugin-logo";

type Props = {
  plugin: Plugin;
};

export const PluginLogo = ({ plugin }: Props) => {
  return (
    <span className={CLASS_NAME}>
      {plugin?.icon ? (
        <img src={`${PLUGIN_LOGO_BASE_URL}${plugin.icon}`} alt="plugin logo" />
      ) : (
        <Icon icon="plugin" />
      )}
    </span>
  );
};
