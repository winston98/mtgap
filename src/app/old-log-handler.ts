import {app} from 'electron';

import {getParsingMetadata} from 'root/api/getindicators';
import {parseOldLogs, withLogParser} from 'root/app/log_parser_manager';
import {sendMessageToHomeWindow} from 'root/app/messages';
import {error} from 'root/lib/logger';

export function parseOldLogsHandler(logs: string[], index: number, skipped: number, shadow?: boolean): void {
  if (!shadow) {
    sendMessageToHomeWindow('show-prompt', {
      message: `Parsing old log: ${index + 1}/${logs.length} (Skipped: ${skipped})`,
      autoclose: 0,
    });
  }
  withLogParser(lp => lp.stop());
  getParsingMetadata(app.getVersion())
    .then(parsingMetadata =>
      parseOldLogs(logs[index], parsingMetadata).then(result => {
        switch (result) {
          case 0:
          case 1:
            if (index + 1 === logs.length) {
              if (!shadow) {
                sendMessageToHomeWindow('show-prompt', {message: 'Parsing complete!', autoclose: 1000});
              }
              withLogParser(lp => lp.start());
            } else {
              parseOldLogsHandler(logs, index + 1, skipped + result);
            }
            break;
          case 2:
            sendMessageToHomeWindow('show-prompt', {
              message: 'Found new user during old logs parsing! Please handle this account and repeat old logs parsing',
              autoclose: 1000,
            });
            break;
        }
      })
    )
    .catch(err => {
      error('Error reading old logs', err);
    });
}